const { expect, use } = require("chai");
const { ethers } = require("hardhat");
const { waffle } = require("@nomiclabs/hardhat-waffle");
const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { cons } = require("fp-ts/lib/NonEmptyArray2v");

describe("Test 1", function () {
  async function deploy() {
    const [owner, user1, user2, user3] = await ethers.getSigners();
    //const provider = waffle.provider;

    const EDU = await ethers.getContractFactory("Web3EDU");
    const edu = await EDU.deploy();
    await edu.deployed();

    const NFT = await ethers.getContractFactory("SoulBoundCert");

    await edu.deployed();

    return { edu, NFT, user1, user2, user3, owner };
  }
  it("should create course", async function () {
    const { edu, user1, user2, user3, owner } = await loadFixture(deploy);

    await edu.createNewCourse("courseDataCID", "baseURI", "courseName", "CSH");

    await edu.createNewCourse(
      "courseDataCID1",
      "baseURI1",
      "courseName1",
      "CSH1"
    );

    const courses = await edu.fetchCourses();

    expect(await courses.length).to.equal(2);
  });

  it("should join course", async function () {
    const { edu, user1, user2, user3, owner } = await loadFixture(deploy);

    const course = await edu.createNewCourse(
      "courseDataCID",
      "baseURI",
      "courseName",
      "CSH"
    );

    await edu.connect(user1).joinCourse(0, user1.address);

    const courses = await edu.fetchCourses();

    expect(await courses[0].students.length).to.equal(1);
  });

  it("upvote course", async function () {
    const { edu, user1, user2, user3, owner } = await loadFixture(deploy);

    const course = await edu.createNewCourse(
      "courseDataCID",
      "baseURI",
      "courseName",
      "CSH"
    );

    await edu.connect(user1).joinCourse(0, user1.address);
    await edu.connect(user1).upVoteCourse(0, user1.address);
    await edu.connect(user1).upVoteCourse(0, user1.address);
    await edu.connect(user1).upVoteCourse(0, user1.address);

    const courses = await edu.fetchCourses();

    expect(await courses[0].upvote).to.equal(1);
  });

  it("downvote course", async function () {
    const { edu, user1, user2, user3, owner } = await loadFixture(deploy);

    const course = await edu.createNewCourse(
      "courseDataCID",
      "baseURI",
      "courseName",
      "CSH"
    );

    await edu.connect(user1).joinCourse(0, user1.address);

    await edu.connect(user1).downVoteCourse(0, user1.address);
    await edu.connect(user1).downVoteCourse(0, user1.address);
    await edu.connect(user1).downVoteCourse(0, user1.address);
    const courses = await edu.fetchCourses();

    expect(await courses[0].downvote).to.equal(1);
  });

  it("complete course", async function () {
    const { edu, user1, user2, user3, owner } = await loadFixture(deploy);

    const course = await edu.createNewCourse(
      "courseDataCID",
      "baseURI",
      "courseName",
      "CSH"
    );

    await edu.connect(user1).joinCourse(0, user1.address);

    await edu.connect(user1).downVoteCourse(0, user1.address);
    await edu.connect(user1).downVoteCourse(0, user1.address);
    await edu.connect(user1).completeCourse(0, user1.address);

    const courses = await edu.fetchCourses();

    expect(await courses[0].views).to.equal(1);
  });

  it("get nft if course completed", async function () {
    const { edu, NFT, user1, user2, user3, owner } = await loadFixture(deploy);

    const course = await edu.createNewCourse(
      "courseDataCID",
      "baseURI",
      "courseName",
      "CSH"
    );

    await edu.connect(user1).joinCourse(0, user1.address);

    await edu.connect(user1).downVoteCourse(0, user1.address);
    await edu.connect(user1).downVoteCourse(0, user1.address);
    await edu.connect(user1).completeCourse(0, user1.address);

    await edu.connect(user1).getCert(0);
    //await edu.connect(user1).getCert(1);

    const courses = await edu.fetchCourses();

    const contract = await NFT.attach(courses[0].nft);

    expect(await await contract.ownerOf(0)).to.equal(user1.address);
  });

  it("should be able to donate", async function () {
    const { edu, user1, user2, user3, owner } = await loadFixture(deploy);

    const course = await edu.createNewCourse(
      "courseDataCID",
      "baseURI",
      "courseName",
      "CSH"
    );

    await edu.connect(user1).joinCourse(0, user1.address);

    await edu.connect(user1).downVoteCourse(0, user1.address);
    await edu.connect(user1).downVoteCourse(0, user1.address);
    await edu.connect(user1).completeCourse(0, user1.address);

    await edu.connect(user1).donateToCoures(0, {
      value: ethers.utils.parseEther("100"),
    });

    await edu.connect(user1).donateToPlatform({
      value: ethers.utils.parseEther("100"),
    });

    const courses = await edu.fetchCourses();

    const provider = ethers.provider;
    const balance = await provider.getBalance(edu.address);
    console.log(balance);

    await edu.withdrawByUser(ethers.utils.parseEther("50"));
    await edu.connect(user1).withdrawByOwner(ethers.utils.parseEther("5"));

    //expect(await courses[0].views).to.equal(1);
  });
});
