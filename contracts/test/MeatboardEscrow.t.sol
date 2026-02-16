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
    address arbAddr = makeAddr("arbitrator");

    uint256 constant AMOUNT = 1000e18;
    uint256 constant DEADLINE_OFFSET = 1 days;

    function setUp() public {
        escrow = new MeatboardEscrow(feeRecipient);
        token = new MockERC20();
        token.mint(agent, AMOUNT * 10);
        token.mint(claimer, AMOUNT * 10);

        vm.prank(agent);
        token.approve(address(escrow), type(uint256).max);
        vm.prank(claimer);
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

    function _claimAndSubmit(uint256 id) internal {
        vm.prank(claimer);
        escrow.claimBounty(id);
        vm.prank(claimer);
        escrow.submitProof(id, "ipfs://proof");
    }

    function _rejectBounty(uint256 id) internal {
        vm.prank(agent);
        escrow.rejectBounty(id, "bad proof");
    }

    function _createAndDispute() internal returns (uint256 id) {
        id = _createBounty();
        _claimAndSubmit(id);
        _rejectBounty(id);
        vm.prank(claimer);
        escrow.disputeBounty(id, "ipfs://evidence");
    }

    // --- createBounty ---

    function test_createBounty() public {
        uint256 id = _createBounty();
        assertEq(id, 0);
        assertEq(escrow.bountyCount(), 1);
        assertEq(token.balanceOf(address(escrow)), AMOUNT);
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
        (,address c,,,,MeatboardEscrow.Status s,,) = escrow.bounties(id);
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

    function test_claimBounty_agentCannotSelfClaim() public {
        uint256 id = _createBounty();
        vm.prank(agent);
        vm.expectRevert("agent cannot claim own bounty");
        escrow.claimBounty(id);
    }

    // --- submitProof ---

    function test_submitProof() public {
        uint256 id = _createBounty();
        vm.prank(claimer);
        escrow.claimBounty(id);
        vm.prank(claimer);
        escrow.submitProof(id, "ipfs://proof");
        (,,,,,MeatboardEscrow.Status s,, uint256 submittedAt) = escrow.bounties(id);
        assertEq(uint8(s), uint8(MeatboardEscrow.Status.Submitted));
        assertEq(submittedAt, block.timestamp);
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
        _claimAndSubmit(id);

        uint256 expectedFee = (AMOUNT * 500) / 10000;
        uint256 expectedPayout = AMOUNT - expectedFee;

        vm.prank(agent);
        escrow.releaseBounty(id);

        assertEq(token.balanceOf(feeRecipient), expectedFee);
        (,,,,,MeatboardEscrow.Status s,,) = escrow.bounties(id);
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
        _claimAndSubmit(id);
        vm.prank(stranger);
        vm.expectRevert("not agent");
        escrow.releaseBounty(id);
    }

    // --- rejectBounty ---

    function test_rejectBounty() public {
        uint256 id = _createBounty();
        _claimAndSubmit(id);
        _rejectBounty(id);
        (,address c,,,,MeatboardEscrow.Status s,,) = escrow.bounties(id);
        assertEq(uint8(s), uint8(MeatboardEscrow.Status.Rejected));
        assertEq(c, claimer);
    }

    function test_rejectBounty_notSubmitted() public {
        uint256 id = _createBounty();
        vm.prank(agent);
        vm.expectRevert("not submitted");
        escrow.rejectBounty(id, "bad");
    }

    function test_rejectBounty_notAgent() public {
        uint256 id = _createBounty();
        _claimAndSubmit(id);
        vm.prank(stranger);
        vm.expectRevert("not agent");
        escrow.rejectBounty(id, "bad");
    }

    // --- claimTimeout ---

    function test_claimTimeout() public {
        uint256 id = _createBounty();
        _claimAndSubmit(id);
        vm.warp(block.timestamp + 72 hours + 1);

        uint256 claimerBefore = token.balanceOf(claimer);
        vm.prank(claimer);
        escrow.claimTimeout(id);

        uint256 expectedFee = (AMOUNT * 500) / 10000;
        uint256 expectedPayout = AMOUNT - expectedFee;
        assertEq(token.balanceOf(claimer) - claimerBefore, expectedPayout);
        assertEq(token.balanceOf(feeRecipient), expectedFee);
    }

    function test_claimTimeout_tooEarly() public {
        uint256 id = _createBounty();
        _claimAndSubmit(id);
        vm.warp(block.timestamp + 72 hours - 1);
        vm.prank(claimer);
        vm.expectRevert("review period active");
        escrow.claimTimeout(id);
    }

    function test_claimTimeout_notClaimer() public {
        uint256 id = _createBounty();
        _claimAndSubmit(id);
        vm.warp(block.timestamp + 72 hours + 1);
        vm.prank(stranger);
        vm.expectRevert("not claimer");
        escrow.claimTimeout(id);
    }

    // --- cancelBounty ---

    function test_cancelBounty_byAgent() public {
        uint256 id = _createBounty();
        uint256 balBefore = token.balanceOf(agent);
        vm.prank(agent);
        escrow.cancelBounty(id);
        assertEq(token.balanceOf(agent), balBefore + AMOUNT);
    }

    function test_cancelBounty_byAnyone_afterDeadline_open() public {
        uint256 id = _createBounty();
        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);
        vm.prank(stranger);
        escrow.cancelBounty(id);
        (,,,,,MeatboardEscrow.Status s,,) = escrow.bounties(id);
        assertEq(uint8(s), uint8(MeatboardEscrow.Status.Cancelled));
    }

    function test_cancelBounty_claimed_afterDeadline() public {
        uint256 id = _createBounty();
        vm.prank(claimer);
        escrow.claimBounty(id);
        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);
        vm.prank(stranger);
        escrow.cancelBounty(id);
        (,,,,,MeatboardEscrow.Status s,,) = escrow.bounties(id);
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
        _claimAndSubmit(id);
        vm.prank(agent);
        escrow.releaseBounty(id);
        vm.prank(agent);
        vm.expectRevert("cannot cancel");
        escrow.cancelBounty(id);
    }

    function test_cancelBounty_rejected_afterDisputeWindow() public {
        uint256 id = _createBounty();
        _claimAndSubmit(id);
        _rejectBounty(id);
        vm.warp(block.timestamp + 48 hours + 1);
        vm.prank(agent);
        escrow.cancelBounty(id);
        (,,,,,MeatboardEscrow.Status s,,) = escrow.bounties(id);
        assertEq(uint8(s), uint8(MeatboardEscrow.Status.Cancelled));
    }

    function test_cancelBounty_rejected_withinDisputeWindow_reverts() public {
        uint256 id = _createBounty();
        _claimAndSubmit(id);
        _rejectBounty(id);
        vm.warp(block.timestamp + 48 hours - 1);
        vm.prank(agent);
        vm.expectRevert("cannot cancel");
        escrow.cancelBounty(id);
    }

    // --- Fee logic ---

    function test_feeCalculation() public {
        uint256 id = _createBounty();
        _claimAndSubmit(id);
        vm.prank(agent);
        escrow.releaseBounty(id);
        assertEq(token.balanceOf(feeRecipient), 50e18);
    }

    function test_zeroFee() public {
        escrow.setFeeBps(0);
        uint256 id = _createBounty();
        _claimAndSubmit(id);
        vm.prank(agent);
        escrow.releaseBounty(id);
        assertEq(token.balanceOf(feeRecipient), 0);
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
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", stranger));
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

    function test_transferOwnership_twoStep() public {
        escrow.transferOwnership(stranger);
        assertEq(escrow.owner(), owner);
        vm.prank(stranger);
        escrow.acceptOwnership();
        assertEq(escrow.owner(), stranger);
    }

    // --- disputeBounty ---

    function test_disputeBounty() public {
        uint256 id = _createBounty();
        _claimAndSubmit(id);
        _rejectBounty(id);

        uint256 bond = (AMOUNT * 500) / 10000;
        uint256 claimerBefore = token.balanceOf(claimer);

        vm.prank(claimer);
        escrow.disputeBounty(id, "ipfs://evidence");

        (,,,,,MeatboardEscrow.Status s,,) = escrow.bounties(id);
        assertEq(uint8(s), uint8(MeatboardEscrow.Status.Disputed));
        assertEq(token.balanceOf(claimer), claimerBefore - bond);
        assertEq(token.balanceOf(address(escrow)), AMOUNT + bond);

        (address initiator, uint256 dBond,, uint256 filedAt, bool resolved) = escrow.disputes(id);
        assertEq(initiator, claimer);
        assertEq(dBond, bond);
        assertEq(filedAt, block.timestamp);
        assertFalse(resolved);
    }

    function test_disputeBounty_notRejected() public {
        uint256 id = _createBounty();
        _claimAndSubmit(id);
        vm.prank(claimer);
        vm.expectRevert("not rejected");
        escrow.disputeBounty(id, "ipfs://evidence");
    }

    function test_disputeBounty_notClaimer() public {
        uint256 id = _createBounty();
        _claimAndSubmit(id);
        _rejectBounty(id);
        vm.prank(stranger);
        vm.expectRevert("not claimer");
        escrow.disputeBounty(id, "ipfs://evidence");
    }

    function test_disputeBounty_windowClosed() public {
        uint256 id = _createBounty();
        _claimAndSubmit(id);
        _rejectBounty(id);
        vm.warp(block.timestamp + 48 hours + 1);
        vm.prank(claimer);
        vm.expectRevert("dispute window closed");
        escrow.disputeBounty(id, "ipfs://evidence");
    }

    // --- resolveDispute ---

    function test_resolveDispute_claimerWins() public {
        escrow.setArbitrator(arbAddr);
        uint256 id = _createAndDispute();

        uint256 bond = (AMOUNT * 500) / 10000;
        uint256 claimerBefore = token.balanceOf(claimer);

        vm.prank(arbAddr);
        escrow.resolveDispute(id, true);

        uint256 expectedFee = (AMOUNT * 500) / 10000;
        uint256 expectedPayout = AMOUNT - expectedFee;
        assertEq(token.balanceOf(claimer) - claimerBefore, expectedPayout + bond);
        assertEq(token.balanceOf(feeRecipient), expectedFee);

        (,,,,,MeatboardEscrow.Status s,,) = escrow.bounties(id);
        assertEq(uint8(s), uint8(MeatboardEscrow.Status.Paid));
        (,,,, bool resolved) = escrow.disputes(id);
        assertTrue(resolved);
    }

    function test_resolveDispute_agentWins() public {
        escrow.setArbitrator(arbAddr);
        uint256 id = _createAndDispute();

        uint256 bond = (AMOUNT * 500) / 10000;
        uint256 agentBefore = token.balanceOf(agent);

        vm.prank(arbAddr);
        escrow.resolveDispute(id, false);

        assertEq(token.balanceOf(agent) - agentBefore, AMOUNT + bond);
        (,,,,,MeatboardEscrow.Status s,,) = escrow.bounties(id);
        assertEq(uint8(s), uint8(MeatboardEscrow.Status.Cancelled));
    }

    function test_resolveDispute_notArbitrator() public {
        uint256 id = _createAndDispute();
        vm.prank(stranger);
        vm.expectRevert("not arbitrator");
        escrow.resolveDispute(id, true);
    }

    function test_resolveDispute_notDisputed() public {
        uint256 id = _createBounty();
        vm.expectRevert("not disputed");
        escrow.resolveDispute(id, true);
    }

    function test_resolveDispute_alreadyResolved() public {
        uint256 id = _createAndDispute();
        escrow.resolveDispute(id, true);
        vm.expectRevert("not disputed");
        escrow.resolveDispute(id, true);
    }

    // --- Admin: arbitrator & bond ---

    function test_setArbitrator() public {
        escrow.setArbitrator(arbAddr);
        assertEq(escrow.arbitrator(), arbAddr);
    }

    function test_setArbitrator_zero() public {
        vm.expectRevert("zero address");
        escrow.setArbitrator(address(0));
    }

    function test_setArbitrator_notOwner() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", stranger));
        escrow.setArbitrator(arbAddr);
    }

    function test_setDisputeBondBps() public {
        escrow.setDisputeBondBps(1000);
        assertEq(escrow.disputeBondBps(), 1000);
    }

    function test_setDisputeBondBps_tooHigh() public {
        vm.expectRevert("bond too high");
        escrow.setDisputeBondBps(1001);
    }

    function test_setDisputeBondBps_notOwner() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", stranger));
        escrow.setDisputeBondBps(100);
    }

    // --- Full flows ---

    function test_fullFlow_rejectNoDisputeThenCancel() public {
        uint256 id = _createBounty();
        _claimAndSubmit(id);
        _rejectBounty(id);

        vm.prank(agent);
        vm.expectRevert("cannot cancel");
        escrow.cancelBounty(id);

        vm.warp(block.timestamp + 48 hours + 1);
        uint256 agentBefore = token.balanceOf(agent);
        vm.prank(stranger);
        escrow.cancelBounty(id);
        assertEq(token.balanceOf(agent) - agentBefore, AMOUNT);
    }

    function test_fullFlow_disputeClaimerWins() public {
        uint256 id = _createBounty();
        _claimAndSubmit(id);
        _rejectBounty(id);

        vm.prank(claimer);
        escrow.disputeBounty(id, "ipfs://evidence");

        uint256 bond = (AMOUNT * 500) / 10000;
        uint256 claimerBefore = token.balanceOf(claimer);

        escrow.resolveDispute(id, true);

        uint256 expectedFee = (AMOUNT * 500) / 10000;
        uint256 expectedPayout = AMOUNT - expectedFee;
        assertEq(token.balanceOf(claimer) - claimerBefore, expectedPayout + bond);
    }

    function test_fullFlow_disputeAgentWins() public {
        uint256 id = _createBounty();
        _claimAndSubmit(id);
        _rejectBounty(id);

        vm.prank(claimer);
        escrow.disputeBounty(id, "ipfs://evidence");

        uint256 bond = (AMOUNT * 500) / 10000;
        uint256 agentBefore = token.balanceOf(agent);

        escrow.resolveDispute(id, false);
        assertEq(token.balanceOf(agent) - agentBefore, AMOUNT + bond);
    }
}
