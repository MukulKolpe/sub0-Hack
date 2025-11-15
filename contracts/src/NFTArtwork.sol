// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTArtwork
 * @dev This is the ERC721 contract for artists.
 * Any artist can call `mintArtwork` to create a new NFT.
 * The `ownerOf` function can be used by the protocol to verify the artist.
 */
contract NFTArtwork is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    constructor() ERC721("NFTArtwork", "ARTWORK") Ownable(msg.sender) {}

    /**
     * @dev Public function for an artist to mint their artwork.
     * The artist will be the initial owner.
     * @param tokenURI A string pointing to the artwork metadata.
     */
    function mintArtwork(string memory tokenURI) public returns (uint256) {
        _tokenIdCounter++;

        uint256 tokenId = _tokenIdCounter;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        return tokenId;
    }

    function _burn(uint256 tokenId) internal override(ERC721) {
        super._burn(tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
