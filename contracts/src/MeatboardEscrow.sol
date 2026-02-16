// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MeatboardEscrow is Ownable2Step {
    using SafeERC20 for IERC20;

    enum Status { Open, Claimed, Submitted, Paid, Cancelled }

    struct Bounty {
        address agent;
        address claimer;
        address token;
        uint256 amount;
        uint256 deadline;
        Status status;
        string metadataURI;
        uint256 submittedAt;
    }

    uint256 public bountyCount;
    mapping(uint256 => Bounty) public bounties;
    uint256 public feeBps = 500; // 5%
    address public feeRecipient;
    uint256 public constant REVIEW_TIMEOUT = 72 hours;

    event BountyCreated(
        uint256 indexed id,
        address indexed agent,
        address token,
        uint256 amount,
        uint256 deadline,
        string metadataURI
    );
    event BountyClaimed(uint256 indexed id, address indexed claimer);
    event BountySubmitted(uint256 indexed id, string proofURI);
    event BountyPaid(uint256 indexed id, address indexed claimer, uint256 payout, uint256 fee);
    event BountyCancelled(uint256 indexed id);
    event BountyRejected(uint256 indexed id);

    constructor(address _feeRecipient) Ownable(msg.sender) {
        feeRecipient = _feeRecipient;
    }

    function createBounty(
        address token,
        uint256 amount,
        uint256 deadline,
        string calldata metadataURI
    ) external returns (uint256 id) {
        require(amount > 0, "zero amount");
        require(deadline > block.timestamp, "deadline passed");

        id = bountyCount++;
        bounties[id] = Bounty({
            agent: msg.sender,
            claimer: address(0),
            token: token,
            amount: amount,
            deadline: deadline,
            status: Status.Open,
            metadataURI: metadataURI,
            submittedAt: 0
        });

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit BountyCreated(id, msg.sender, token, amount, deadline, metadataURI);
    }

    function claimBounty(uint256 id) external {
        Bounty storage b = bounties[id];
        require(b.status == Status.Open, "not open");
        require(block.timestamp < b.deadline, "expired");
        require(msg.sender != b.agent, "agent cannot claim own bounty");

        b.status = Status.Claimed;
        b.claimer = msg.sender;
        emit BountyClaimed(id, msg.sender);
    }

    function submitProof(uint256 id, string calldata proofURI) external {
        Bounty storage b = bounties[id];
        require(b.status == Status.Claimed, "not claimed");
        require(msg.sender == b.claimer, "not claimer");

        b.status = Status.Submitted;
        b.submittedAt = block.timestamp;
        emit BountySubmitted(id, proofURI);
    }

    function releaseBounty(uint256 id) external {
        Bounty storage b = bounties[id];
        require(b.status == Status.Submitted, "not submitted");
        require(msg.sender == b.agent, "not agent");

        b.status = Status.Paid;
        uint256 fee = (b.amount * feeBps) / 10000;
        uint256 payout = b.amount - fee;

        IERC20(b.token).safeTransfer(b.claimer, payout);
        if (fee > 0) IERC20(b.token).safeTransfer(feeRecipient, fee);

        emit BountyPaid(id, b.claimer, payout, fee);
    }

    function rejectBounty(uint256 id) external {
        Bounty storage b = bounties[id];
        require(b.status == Status.Submitted, "not submitted");
        require(msg.sender == b.agent, "not agent");

        b.status = Status.Open;
        b.claimer = address(0);
        b.submittedAt = 0;
        emit BountyRejected(id);
    }

    function claimTimeout(uint256 id) external {
        Bounty storage b = bounties[id];
        require(b.status == Status.Submitted, "not submitted");
        require(msg.sender == b.claimer, "not claimer");
        require(block.timestamp >= b.submittedAt + REVIEW_TIMEOUT, "review period active");

        b.status = Status.Paid;
        uint256 fee = (b.amount * feeBps) / 10000;
        uint256 payout = b.amount - fee;

        IERC20(b.token).safeTransfer(b.claimer, payout);
        if (fee > 0) IERC20(b.token).safeTransfer(feeRecipient, fee);

        emit BountyPaid(id, b.claimer, payout, fee);
    }

    function cancelBounty(uint256 id) external {
        Bounty storage b = bounties[id];
        require(
            (b.status == Status.Open && msg.sender == b.agent) ||
            (b.status == Status.Open && block.timestamp >= b.deadline) ||
            (b.status == Status.Claimed && block.timestamp >= b.deadline),
            "cannot cancel"
        );

        b.status = Status.Cancelled;
        IERC20(b.token).safeTransfer(b.agent, b.amount);
        emit BountyCancelled(id);
    }

    function setFeeBps(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 10000, "fee too high");
        feeBps = _feeBps;
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "zero address");
        feeRecipient = _feeRecipient;
    }
}
