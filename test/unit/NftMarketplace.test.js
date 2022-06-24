const { assert, expect } = require("chai")
const { network, ethers, deployments } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip()
    : describe("Nft Marketplace Tests", function () {
          let nftMarketplace, basicNft, deployer, player
          const PRICE = ethers.utils.parseEther("0.1")
          const TOKEN_ID = 0
          beforeEach(async function () {
              account = await ethers.getSigners()
              deployer = account[0]
              player = account[1]
              await deployments.fixture(["all"])
              nftMarketplace = await ethers.getContract("NftMarketplace")
              basicNft = await ethers.getContract("BasicNft")
              await basicNft.mintNft()
              await basicNft.approve(nftMarketplace.address, TOKEN_ID)
          })

          it("lists and can be bought", async function () {
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              const playerConnectedNftMarketplace = nftMarketplace.connect(player)
              await playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                  value: PRICE,
              })
              const newOwner = await basicNft.ownerOf(TOKEN_ID)
              const deployerProceeds = await nftMarketplace.getProceeds(deployer.address)
              assert(newOwner.toString() == player.address)
              assert(deployerProceeds.toString() == PRICE.toString())
          })

          describe("listItem", function () {
              it("emit an event after Item listed", async function () {
                  expect(
                      await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.emit("ItemListed")
              })
              it("exclusively item that haven't been listed", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const error = `Already Listed("${basicNft.address}, ${TOKEN_ID})`

                  expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith(error)
              })
          })

          describe("buyItem", function () {
              it("emit an event after buy item", async function () {
                  expect(await nftMarketplace.buyItem(basicNft.address, TOKEN_ID)).to.be.emit(
                      "ItemBought"
                  )
              })
          })

          describe("cancelListing", function () {
              it("emit an event after cancel the Listing", async function () {
                  expect(
                      await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.emit("ItemCanceled")
              })
          })

          describe("updateListing", function () {
              it("emit an event when update the list", async function () {
                  expect(
                      await nftMarketplace.updateListing(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.emit("ItemListed")
              })
          })

          describe("withdrawProceeds", function () {})
      })
