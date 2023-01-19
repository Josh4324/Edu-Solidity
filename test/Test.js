const { expect, use } = require("chai");
const { ethers } = require("hardhat");
const { waffle } = require("hardhat");

describe("Test 1", function () {
  it("should pass", async function () {
    const [owner, user1, user2, user3] = await ethers.getSigners();
    //const provider = waffle.provider;

    const NFT = await ethers.getContractFactory("SoulBoundCert");
    const nft = await NFT.deploy(
      "https://ipfs.io/ipfs/QmeZHCMmbShTKi1ShcWEWgj1nBZWujbSbt8o8MjABvyUDb",
      "AA",
      "AA"
    );

    await nft.deployed();

    nft.mint();
  });
});
