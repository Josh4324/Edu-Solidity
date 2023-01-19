// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Soul.sol";
import "hardhat/console.sol";

contract Web3EDU {
    event NewCourseCreated(
        uint256 courseID,
        address creatorAddress,
        string courseDataCID
    );

    address owner;

    uint256 public counter = 0;

    event ConfirmedStudent(uint256 courseID, address studentAddress);

    event Donations(uint256 amount);

    event Vote(uint256 courseId, address student);

    event View(uint256 courseId, address student);

    struct Course {
        uint256 courseId;
        string courseDataCID;
        address courseOwner;
        address[] students;
        uint256 upvote;
        uint256 downvote;
        uint256 views;
        uint256 donations;
        SoulBoundCert nft;
    }

    struct User {
        uint256 donation;
    }

    mapping(uint256 => Course) public idToCourse;
    mapping(address => mapping(uint256 => bool)) public idToUpVote;
    mapping(address => mapping(uint256 => bool)) public idToDownVote;
    mapping(address => mapping(uint256 => bool)) public courseComplete;
    mapping(address => uint256) private donation;
    mapping(address => bool) private authors;

    modifier onlyAuthor() {
        require(authors[msg.sender] == true, "Only Authors can withraw fund");
        _;
    }

    constructor() payable {
        owner = payable(msg.sender);
    }

    function createNewCourse(
        string calldata courseDataCID,
        string memory baseURI,
        string memory courseName,
        string memory courseShortName
    ) external {
        SoulBoundCert NFT = new SoulBoundCert(
            baseURI,
            courseName,
            courseShortName
        );

        address[] memory students;

        //this creates a new CreateCourse struct and adds it to the idToCourse mapping
        idToCourse[counter] = Course(
            counter,
            courseDataCID,
            msg.sender,
            students,
            0,
            0,
            0,
            0,
            NFT
        );
        counter++;
        authors[msg.sender] = true;
        emit NewCourseCreated(counter, msg.sender, courseDataCID);
    }

    function joinCourse(uint256 courseId, address student) public {
        // look up course
        Course storage course = idToCourse[courseId];

        require(student == msg.sender);

        // add student to course list
        course.students.push(student);

        emit ConfirmedStudent(courseId, student);
    }

    function upVoteCourse(uint256 courseId, address student) public {
        require(student == msg.sender, "Wrong user");

        // look up course
        Course storage course = idToCourse[courseId];

        if (idToUpVote[msg.sender][courseId] == false) {
            course.upvote = course.upvote + 1;
            idToUpVote[msg.sender][courseId] = true;
        } else {
            course.upvote = course.upvote - 1;
            idToUpVote[msg.sender][courseId] = false;
        }

        emit Vote(courseId, student);
    }

    function downVoteCourse(uint256 courseId, address student) public {
        require(student == msg.sender, "Wrong user");

        // look up course
        Course storage course = idToCourse[courseId];

        if (idToDownVote[msg.sender][courseId] == false) {
            course.downvote = course.downvote + 1;
            idToDownVote[msg.sender][courseId] = true;
        } else {
            course.downvote = course.downvote - 1;
            idToDownVote[msg.sender][courseId] = false;
        }

        emit Vote(courseId, student);
    }

    function completeCourse(uint256 courseId, address student) public {
        require(student == msg.sender, "Wrong user");

        require(
            courseComplete[msg.sender][courseId] == false,
            "Course Completed"
        );

        courseComplete[msg.sender][courseId] = true;

        // look up course
        Course storage course = idToCourse[courseId];

        // add student to course list
        course.views = course.views + 1;

        emit View(courseId, student);
    }

    function donateToCoures(uint256 courseId) public payable {
        // look up course
        Course storage course = idToCourse[courseId];

        course.donations = course.donations + msg.value;

        uint256 tax = (msg.value * 10) / 100;

        uint256 amount = msg.value - tax;

        donation[course.courseOwner] = amount;

        emit Donations(msg.value);
    }

    function donateToPlatform() public payable {
        emit Donations(msg.value);
    }

    function getCert(uint256 courseId) public {
        require(
            courseComplete[msg.sender][courseId] == true,
            "Course has not been completed"
        );

        // look up course
        Course storage course = idToCourse[courseId];

        // mint course nft
        course.nft.mint(msg.sender);
    }

    function withdrawByUser(uint256 amount) public onlyAuthor {
        // get the amount of Ether stored in this contract
        uint256 balance = donation[msg.sender];

        require(amount <= balance, "Insufficient funds");

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Failed to send Matic");
    }

    function withdrawByOwner(uint256 amount) public {
        require(msg.sender == owner, "Not Owner");
        // get the amount of Ether stored in this contract
        uint256 balance = address(this).balance;
        require(amount <= balance, "Insufficient funds");
        // send all Ether to owner
        // Owner can receive Ether since the address of owner is payable
        (bool success, ) = owner.call{value: amount}("");
        require(success, "Failed to send Ether");
    }

    /* Returns all unsold List items */
    function fetchCourses() public view returns (Course[] memory) {
        uint256 currentIndex = 0;

        Course[] memory items = new Course[](counter);

        for (uint256 i = 0; i < counter; i++) {
            uint256 currentId = i;

            Course storage currentItem = idToCourse[currentId];
            items[currentIndex] = currentItem;

            currentIndex += 1;
        }
        return items;
    }

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}
}
