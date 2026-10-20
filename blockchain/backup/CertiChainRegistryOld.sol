// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract CertiChainRegistryOld {

    address public owner;
    uint256 public totalCertificates;

    struct Institution {
        string name;
        bool verified;
        bool exists;
    }

    struct Certificate {
        string certificateId;
        string studentName;
        string qualification;
        string institutionName;
        bytes32 documentHash;
        address issuedBy;
        uint256 issuedAt;
        bool revoked;
        bool exists;
    }

    mapping(address => Institution) public institutions;
    mapping(string => Certificate) private certificates;

    event InstitutionRegistered(
        address indexed institutionWallet,
        string institutionName
    );

    event CertificateIssued(
        string certificateId,
        address indexed institutionWallet,
        bytes32 documentHash
    );

    event CertificateRevoked(
        string certificateId,
        address indexed revokedBy
    );

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only the contract owner can do this"
        );
        _;
    }

    modifier onlyVerifiedInstitution() {
        require(
            institutions[msg.sender].verified,
            "Institution is not verified"
        );
        _;
    }

    function registerInstitution(
        address institutionWallet,
        string memory institutionName
    )
        external
        onlyOwner
    {
        require(
            institutionWallet != address(0),
            "Invalid institution wallet"
        );

        require(
            bytes(institutionName).length > 0,
            "Institution name is required"
        );

        institutions[institutionWallet] =
            Institution({
                name: institutionName,
                verified: true,
                exists: true
            });

        emit InstitutionRegistered(
            institutionWallet,
            institutionName
        );
    }

    function issueCertificate(
        string memory certificateId,
        string memory studentName,
        string memory qualification,
        bytes32 documentHash
    )
        external
        onlyVerifiedInstitution
    {
        require(
            bytes(certificateId).length > 0,
            "Certificate ID is required"
        );

        require(
            !certificates[certificateId].exists,
            "Certificate already exists"
        );

        require(
            documentHash != bytes32(0),
            "Document hash is required"
        );

        certificates[certificateId] =
            Certificate({
                certificateId: certificateId,
                studentName: studentName,
                qualification: qualification,
                institutionName:
                    institutions[msg.sender].name,
                documentHash: documentHash,
                issuedBy: msg.sender,
                issuedAt: block.timestamp,
                revoked: false,
                exists: true
            });

        totalCertificates++;

        emit CertificateIssued(
            certificateId,
            msg.sender,
            documentHash
        );
    }

    function revokeCertificate(
        string memory certificateId
    )
        external
    {
        Certificate storage certificate =
            certificates[certificateId];

        require(
            certificate.exists,
            "Certificate does not exist"
        );

        require(
            msg.sender == certificate.issuedBy ||
            msg.sender == owner,
            "Not authorised to revoke"
        );

        require(
            !certificate.revoked,
            "Certificate is already revoked"
        );

        certificate.revoked = true;

        emit CertificateRevoked(
            certificateId,
            msg.sender
        );
    }

    function verifyCertificate(
        string memory certificateId,
        bytes32 documentHash
    )
        external
        view
        returns (
            bool isValid,
            bool isRevoked,
            string memory institutionName
        )
    {
        Certificate memory certificate =
            certificates[certificateId];

        if (!certificate.exists) {
            return (
                false,
                false,
                ""
            );
        }

        bool hashMatches =
            certificate.documentHash ==
            documentHash;

        bool valid =
            hashMatches &&
            !certificate.revoked;

        return (
            valid,
            certificate.revoked,
            certificate.institutionName
        );
    }

    function getCertificate(
        string memory certificateId
    )
        external
        view
        returns (
            Certificate memory
        )
    {
        require(
            certificates[certificateId].exists,
            "Certificate does not exist"
        );

        return
            certificates[certificateId];
    }

    function checkInstitution(
        address institutionWallet
    )
        external
        view
        returns (
            string memory institutionName,
            bool verified
        )
    {
        Institution memory institution =
            institutions[institutionWallet];

        return (
            institution.name,
            institution.verified
        );
    }
}

