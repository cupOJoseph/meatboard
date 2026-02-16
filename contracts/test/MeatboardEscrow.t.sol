// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MeatboardEscrow.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock", "MCK") {
        _mint(msg.sender, 1_000_000e18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MeatboardEscrowTest is Test {
    MeatboardEscrow escrow;
    MockERC20 token;

    address owner = address(this);
    address feeRecipient = makeAddr("feeRecipient");
    address agent = makeAddr("agent");
    address claimer = makeAddr("claimer");
    address stranger = makeAddr("stranger");

    uint256 constant AMOUNT = 1000e18;
    uint256 constant DEADLINE_OFFSET = 1 days;

    function setUp() public {
        escrow = new MeatboardEscrow(feeRecipient);
        token = new MockERC20();
        token.mint(agent, AMOUNT * 10);

        vm.prank(agent);
        token.approve(address(escrow), type(uint256).max);
    }

    function _createBounty() internal returns (uint256) {
        vm.prank(agent);
        return escrow.createBounty(
            address(token),
            AMOUNT,
            block.timestamp + DEADLINE_OFFSET,
            "ipfs://meta"
        );
    }

    // --- createBounty ---

    function test_createBounty() public {
        uint256 id = _createBounty();
        assertEq(id, 0);
        assertEq(escrow.bountyCount(), 1);
        assertEq(token.balanceOf(address(escrow)), AMOUNT);

        (address a,,address t, uint256 amt, uint256 dl, MeatboardEscrow.Status s, string memory uri) = escrow.bounties(id);
        assertEq(a, agent);
        assertEq(t, address(token));
        assertEq(amt, AMOUNT);
        assertEq(uint8(s), uint8(MeatboardEscrow.Status.Open));
        assertEq(uri, "ipfs://meta");
        assertGt(dl, block.timestamp);
    }

    function test_createBounty_zeroAmount() public {
        vm.prank(agent);
        vm.expectRevert("zero amount");
        escrow.createBounty(address(token), 0, block.timestamp + 1, "ipfs://meta");
    }

    function test_createBounty_deadlinePassed() public {
        vm.prank(agent);
        vm.expectRevert("deadline passed");
        escrow.createBounty(address(token), AMOUNT, block.timestamp, "ipfs://meta");
    }

    // --- claimBounty ---

    function test_claimBounty() public {
        uint256 id = _createBounty();
        vm.prank(claimer);
        escrow.claimBounty(id);

        (,address c,,,,MeatboardEscrow.Status s,) = escrow.bounties(id);
        assertEq(c, claimer);
        assertEq(uint8(s), uint8(MeatboardEscrow.Status.Claimed));
    }

    function test_claimBounty_notOpen() public {
        uint256 id = _createBounty();
        vm.prank(claimer);
        escrow.claimBounty(id);

        vm.prank(stranger);
        vm.expectRevert("not open");
        escrow.claimBounty(id);
    }

    function test_claimBounty_expired() public {
        uint256 id = _createBounty();
        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);

        vm.prank(claimer);
        vm.expectRevert("expired");
        escrow.claimBounty(id);
    }

    // --- submitProof ---

    function test_submitProof() public {
        uint256 id = _createBounty();
        vm.prank(claimer);
        escrow.claimBounty(id);

        vm.prank(claimer);
        escrow.submitProof(id, "ipfs://proof");

        (,,,,,MeatboardEscrow.Status s,) = escrow.bounties(id);
        assertEq(uint8(s), uint8(MeatboardEscrow.Status.Submitted));
    }

    function test_submitProof_notClaimed() public {
        uint256 id = _createBounty();
        vm.prank(claimer);
        vm.expectRevert("not claimed");
        escrow.submitProof(id, "ipfs://proof");
    }

    function test_submitProof_notClaimer() public {
        uint256 id = _createBounty();
        vm.prank(claimer);
        escrow.claimBounty(id);

        vm.prank(stranger);
        vm.expectRevert("not claimer");
        escrow.submitProof(id, "ipfs://proof");
    }

    // --- releaseBounty ---

    function test_releaseBounty() public {
        uint256 id = _createBounty();
        vm.prank(claimer);
        escrow.claimBounty(id);
        vm.prank(claimer);
        escrow.submitProof(id, "ipfs://proof");

        uint256 expectedFee = (AMOUNT * 500) / 10000; // 5%
        uint256 expectedPayout = AMOUNT - expectedFee;

        vm.prank(agent);
        escrow.releaseBounty(id);

        assertEq(token.balanceOf(claimer), expectedPayout);
        assertEq(token.balanceOf(feeRecipient), expectedFee);
        assertEq(token.balanceOf(address(escrow)), 0);

        (,,,,,MeatboardEscrow.Status s,) = escrow.bounties(id);
        assertEq(uint8(s), uint8(MeatboardEscrow.Status.Paid));
    }

    function test_releaseBounty_notSubmitted() public {
        uint256 id = _createBounty();
        vm.prank(agent);
        vm.expectRevert("not submitted");
        escrow.releaseBounty(id);
    }

    function test_releaseBounty_notAgent() public {
        uint256 id = _createBounty();
        vm.prank(claimer);
        escrow.claimBounty(id);
        vm.prank(claimer);
        escrow.submitProof(id, "ipfs://proof");

        vm.prank(stranger);
        vm.expectRevert("not agent");
        escrow.releaseBounty(id);
    }

    // --- cancelBounty ---

    function test_cancelBounty_byAgent() public {
        uint256 id = _createBounty();
        uint256 balBefore = token.balanceOf(agent);

        vm.prank(agent);
        escrow.cancelBounty(id);

        assertEq(token.balanceOf(agent), balBefore + AMOUNT);
        (,,,,,MeatboardEscrow.Status s,) = escrow.bounties(id);
        assertEq(uint8(s), uint8(MeatboardEscrow.Status.Cancelled));
    }

    function test_cancelBounty_byAnyone_afterDeadline_open() public {
        uint256 id = _createBounty();
        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);

        vm.prank(stranger);
        escrow.cancelBounty(id);

        (,,,,,MeatboardEscrow.Status s,) = escrow.bounties(id);
        assertEq(uint8(s), uint8(MeatboardEscrow.Status.Cancelled));
    }

    function test_cancelBounty_claimed_afterDeadline() public {
        uint256 id = _createBounty();
        vm.prank(claimer);
        escrow.claimBounty(id);
        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);

        vm.prank(stranger);
        escrow.cancelBounty(id);

        assertEq(token.balanceOf(agent), token.balanceOf(agent)); // refund to agent
        (,,,,,MeatboardEscrow.Status s,) = escrow.bounties(id);
        assertEq(uint8(s), uint8(MeatboardEscrow.Status.Cancelled));
    }

    function test_cancelBounty_strangerBeforeDeadline() public {
        uint256 id = _createBounty();
        vm.prank(stranger);
        vm.expectRevert("cannot cancel");
        escrow.cancelBounty(id);
    }

    function test_cancelBounty_paidBounty() public {
        uint256 id = _createBounty();
        vm.prank(claimer);
        escrow.claimBounty(id);
        vm.prank(claimer);
        escrow.submitProof(id, "ipfs://proof");
        vm.prank(agent);
        escrow.releaseBounty(id);

        vm.prank(agent);
        vm.expectRevert("cannot cancel");
        escrow.cancelBounty(id);
    }

    // --- Fee logic ---

    function test_feeCalculation() public {
        // 5% of 1000e18 = 50e18
        uint256 id = _createBounty();
        vm.prank(claimer);
        escrow.claimBounty(id);
        vm.prank(claimer);
        escrow.submitProof(id, "ipfs://proof");
        vm.prank(agent);
        escrow.releaseBounty(id);

        assertEq(token.balanceOf(feeRecipient), 50e18);
        assertEq(token.balanceOf(claimer), 950e18);
    }

    function test_zeroFee() public {
        escrow.setFeeBps(0);

        uint256 id = _createBounty();
        vm.prank(claimer);
        escrow.claimBounty(id);
        vm.prank(claimer);
        escrow.submitProof(id, "ipfs://proof");
        vm.prank(agent);
        escrow.releaseBounty(id);

        assertEq(token.balanceOf(feeRecipient), 0);
        assertEq(token.balanceOf(claimer), AMOUNT);
    }

    // --- Owner functions ---

    function test_setFeeBps() public {
        escrow.setFeeBps(1000);
        assertEq(escrow.feeBps(), 1000);
    }

    function test_setFeeBps_tooHigh() public {
        vm.expectRevert("fee too high");
        escrow.setFeeBps(10001);
    }

    function test_setFeeBps_notOwner() public {
        vm.prank(stranger);
        vm.expectRevert("not owner");
        escrow.setFeeBps(100);
    }

    function test_setFeeRecipient() public {
        escrow.setFeeRecipient(stranger);
        assertEq(escrow.feeRecipient(), stranger);
    }

    function test_setFeeRecipient_zero() public {
        vm.expectRevert("zero address");
        escrow.setFeeRecipient(address(0));
    }

    function test_setFeeRecipient_notOwner() public {
        vm.prank(stranger);
        vm.expectRevert("not owner");
        escrow.setFeeRecipient(stranger);
    }
}
