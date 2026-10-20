// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CertiChainRegistry
    is AccessControl,
       Pausable,
       ReentrancyGuard
{
    bytes32 public constant REGISTRAR_ROLE =
        keccak256("REGISTRAR_ROLE");

    bytes32 public constant ISSUER_ROLE =
        keccak256("ISSUER_ROLE");

    bytes32 public constant REVOKER_ROLE =
        keccak256("REVOKER_ROLE");

    bytes32 public constant AUDITOR_ROLE =
        keccak256("AUDITOR_ROLE");

    bytes32 public constant PAUSER_ROLE =
        keccak256("PAUSER_ROLE");

    address public owner;

    uint256 public totalCertificates;
    uint256 public totalInstitutions;

    enum InstitutionStatus {
        None,
        Pending,
        Verified,
        Suspended,
        Revoked
    }

    enum CertificateStatus {
        None,
        Active,
        Revoked,
        Superseded
    }

    struct Institution {
        string name;
        bool verified;
        bool exists;

        InstitutionStatus status;

        uint256 registeredAt;
        uint256 updatedAt;
    }

    struct Certificate {
        string certificateId;
        string studentName;
        string qualification;
        string institutionName;

        bytes32 documentHash;

        address issuedBy;
        address institutionWallet;

        uint256 issuedAt;

        bool revoked;
        bool exists;

        uint256 updatedAt;
        uint256 version;

        CertificateStatus status;

        string revokeReason;
        string previousCertificateId;
        string supersededBy;
    }

    mapping(address => Institution)
        public institutions;

    mapping(string => Certificate)
        private certificates;

    mapping(bytes32 => string)
        private certificateIdByHash;

    mapping(address => address)
        public staffInstitution;

    mapping(string => string[])
        private certificateHistory;

    event InstitutionRequested(
        address indexed institutionWallet,
        string institutionName
    );

    event InstitutionRegistered(
        address indexed institutionWallet,
        string institutionName
    );

    event InstitutionStatusChanged(
        address indexed institutionWallet,
        InstitutionStatus oldStatus,
        InstitutionStatus newStatus,
        address indexed changedBy
    );

    event InstitutionStaffAssigned(
        address indexed institutionWallet,
        address indexed staffWallet,
        bool canIssue,
        bool canRevoke
    );

    event InstitutionStaffRemoved(
        address indexed institutionWallet,
        address indexed staffWallet
    );

    event CertificateIssued(
        string certificateId,
        address indexed institutionWallet,
        bytes32 documentHash
    );

    event AdvancedCertificateIssued(
        string certificateId,
        address indexed institutionWallet,
        address indexed issuedBy,
        bytes32 documentHash,
        uint256 version
    );

    event CertificateRevoked(
        string certificateId,
        address indexed revokedBy
    );

    event CertificateRevokedWithReason(
        string certificateId,
        address indexed revokedBy,
        string reason
    );

    event CertificateSuperseded(
        string oldCertificateId,
        string newCertificateId,
        address indexed updatedBy
    );

    event EmergencyPause(
        address indexed pausedBy
    );

    event EmergencyUnpause(
        address indexed unpausedBy
    );

    constructor() {
        owner = msg.sender;

        _grantRole(
            DEFAULT_ADMIN_ROLE,
            msg.sender
        );

        _grantRole(
            REGISTRAR_ROLE,
            msg.sender
        );

        _grantRole(
            AUDITOR_ROLE,
            msg.sender
        );

        _grantRole(
            PAUSER_ROLE,
            msg.sender
        );
    }

    modifier onlyVerifiedIssuer() {
        address institutionWallet =
            staffInstitution[msg.sender];

        require(
            institutionWallet != address(0),
            "Wallet is not connected to an institution"
        );

        require(
            institutions[institutionWallet].exists,
            "Institution does not exist"
        );

        require(
            institutions[institutionWallet].status ==
                InstitutionStatus.Verified,
            "Institution is not verified"
        );

        require(
            hasRole(
                ISSUER_ROLE,
                msg.sender
            ),
            "Wallet does not have issuer permission"
        );

        _;
    }

    function requestInstitutionRegistration(
        string memory institutionName
    )
        external
        whenNotPaused
    {
        require(
            bytes(institutionName).length > 0,
            "Institution name required"
        );

        require(
            !institutions[msg.sender].exists,
            "Institution already exists"
        );

        institutions[msg.sender] =
            Institution({
                name: institutionName,
                verified: false,
                exists: true,
                status:
                    InstitutionStatus.Pending,
                registeredAt:
                    block.timestamp,
                updatedAt:
                    block.timestamp
            });

        totalInstitutions++;

        emit InstitutionRequested(
            msg.sender,
            institutionName
        );
    }

    function registerInstitution(
        address institutionWallet,
        string memory institutionName
    )
        external
        onlyRole(REGISTRAR_ROLE)
        whenNotPaused
    {
        require(
            institutionWallet != address(0),
            "Invalid institution wallet"
        );

        require(
            bytes(institutionName).length > 0,
            "Institution name required"
        );

        require(
            !institutions[
                institutionWallet
            ].exists,
            "Institution already exists"
        );

        institutions[institutionWallet] =
            Institution({
                name: institutionName,
                verified: true,
                exists: true,
                status:
                    InstitutionStatus.Verified,
                registeredAt:
                    block.timestamp,
                updatedAt:
                    block.timestamp
            });

        totalInstitutions++;

        staffInstitution[
            institutionWallet
        ] = institutionWallet;

        _grantRole(
            ISSUER_ROLE,
            institutionWallet
        );

        _grantRole(
            REVOKER_ROLE,
            institutionWallet
        );

        emit InstitutionRegistered(
            institutionWallet,
            institutionName
        );
    }

    function approveInstitution(
        address institutionWallet
    )
        external
        onlyRole(REGISTRAR_ROLE)
        whenNotPaused
    {
        Institution storage institution =
            institutions[
                institutionWallet
            ];

        require(
            institution.exists,
            "Institution does not exist"
        );

        require(
            institution.status ==
                InstitutionStatus.Pending,
            "Institution is not pending"
        );

        InstitutionStatus oldStatus =
            institution.status;

        institution.status =
            InstitutionStatus.Verified;

        institution.verified = true;

        institution.updatedAt =
            block.timestamp;

        staffInstitution[
            institutionWallet
        ] = institutionWallet;

        _grantRole(
            ISSUER_ROLE,
            institutionWallet
        );

        _grantRole(
            REVOKER_ROLE,
            institutionWallet
        );

        emit InstitutionStatusChanged(
            institutionWallet,
            oldStatus,
            InstitutionStatus.Verified,
            msg.sender
        );
    }

    function suspendInstitution(
        address institutionWallet
    )
        external
        onlyRole(REGISTRAR_ROLE)
    {
        Institution storage institution =
            institutions[
                institutionWallet
            ];

        require(
            institution.exists,
            "Institution does not exist"
        );

        require(
            institution.status ==
                InstitutionStatus.Verified,
            "Institution is not active"
        );

        InstitutionStatus oldStatus =
            institution.status;

        institution.status =
            InstitutionStatus.Suspended;

        institution.verified = false;

        institution.updatedAt =
            block.timestamp;

        emit InstitutionStatusChanged(
            institutionWallet,
            oldStatus,
            InstitutionStatus.Suspended,
            msg.sender
        );
    }

    function reactivateInstitution(
        address institutionWallet
    )
        external
        onlyRole(REGISTRAR_ROLE)
    {
        Institution storage institution =
            institutions[
                institutionWallet
            ];

        require(
            institution.exists,
            "Institution does not exist"
        );

        require(
            institution.status ==
                InstitutionStatus.Suspended,
            "Institution is not suspended"
        );

        InstitutionStatus oldStatus =
            institution.status;

        institution.status =
            InstitutionStatus.Verified;

        institution.verified = true;

        institution.updatedAt =
            block.timestamp;

        emit InstitutionStatusChanged(
            institutionWallet,
            oldStatus,
            InstitutionStatus.Verified,
            msg.sender
        );
    }

    function revokeInstitution(
        address institutionWallet
    )
        external
        onlyRole(REGISTRAR_ROLE)
    {
        Institution storage institution =
            institutions[
                institutionWallet
            ];

        require(
            institution.exists,
            "Institution does not exist"
        );

        require(
            institution.status !=
                InstitutionStatus.Revoked,
            "Institution already revoked"
        );

        InstitutionStatus oldStatus =
            institution.status;

        institution.status =
            InstitutionStatus.Revoked;

        institution.verified = false;

        institution.updatedAt =
            block.timestamp;

        _revokeRole(
            ISSUER_ROLE,
            institutionWallet
        );

        _revokeRole(
            REVOKER_ROLE,
            institutionWallet
        );

        emit InstitutionStatusChanged(
            institutionWallet,
            oldStatus,
            InstitutionStatus.Revoked,
            msg.sender
        );
    }

    function assignInstitutionStaff(
        address institutionWallet,
        address staffWallet,
        bool canIssue,
        bool canRevoke
    )
        external
        whenNotPaused
    {
        require(
            institutionWallet != address(0),
            "Invalid institution wallet"
        );

        require(
            staffWallet != address(0),
            "Invalid staff wallet"
        );

        require(
            institutions[
                institutionWallet
            ].exists,
            "Institution does not exist"
        );

        require(
            institutions[
                institutionWallet
            ].status ==
                InstitutionStatus.Verified,
            "Institution not verified"
        );

        require(
            msg.sender ==
                institutionWallet ||
            hasRole(
                REGISTRAR_ROLE,
                msg.sender
            ),
            "Not authorised"
        );

        address currentInstitution =
            staffInstitution[
                staffWallet
            ];

        require(
            currentInstitution ==
                address(0) ||
            currentInstitution ==
                institutionWallet,
            "Staff already belongs to another institution"
        );

        staffInstitution[
            staffWallet
        ] = institutionWallet;

        if (canIssue) {
            _grantRole(
                ISSUER_ROLE,
                staffWallet
            );
        } else {
            _revokeRole(
                ISSUER_ROLE,
                staffWallet
            );
        }

        if (canRevoke) {
            _grantRole(
                REVOKER_ROLE,
                staffWallet
            );
        } else {
            _revokeRole(
                REVOKER_ROLE,
                staffWallet
            );
        }

        emit InstitutionStaffAssigned(
            institutionWallet,
            staffWallet,
            canIssue,
            canRevoke
        );
    }

    function removeInstitutionStaff(
        address staffWallet
    )
        external
    {
        address institutionWallet =
            staffInstitution[
                staffWallet
            ];

        require(
            institutionWallet !=
                address(0),
            "Staff wallet is not assigned"
        );

        require(
            msg.sender ==
                institutionWallet ||
            hasRole(
                REGISTRAR_ROLE,
                msg.sender
            ),
            "Not authorised"
        );

        _revokeRole(
            ISSUER_ROLE,
            staffWallet
        );

        _revokeRole(
            REVOKER_ROLE,
            staffWallet
        );

        staffInstitution[
            staffWallet
        ] = address(0);

        emit InstitutionStaffRemoved(
            institutionWallet,
            staffWallet
        );
    }

    function issueCertificate(
        string memory certificateId,
        string memory studentName,
        string memory qualification,
        bytes32 documentHash
    )
        external
        onlyVerifiedIssuer
        whenNotPaused
        nonReentrant
    {
        address institutionWallet =
            staffInstitution[
                msg.sender
            ];

        _issueCertificate(
            certificateId,
            studentName,
            qualification,
            documentHash,
            institutionWallet,
            1,
            ""
        );
    }

    function _issueCertificate(
        string memory certificateId,
        string memory studentName,
        string memory qualification,
        bytes32 documentHash,
        address institutionWallet,
        uint256 version,
        string memory previousCertificateId
    )
        internal
    {
        require(
            bytes(certificateId).length > 0,
            "Certificate ID required"
        );

        require(
            bytes(studentName).length > 0,
            "Student name required"
        );

        require(
            bytes(qualification).length > 0,
            "Qualification required"
        );

        require(
            documentHash != bytes32(0),
            "Document hash required"
        );

        require(
            !certificates[
                certificateId
            ].exists,
            "Certificate already exists"
        );

        require(
            bytes(
                certificateIdByHash[
                    documentHash
                ]
            ).length == 0,
            "Document already registered"
        );

        certificates[
            certificateId
        ] =
            Certificate({
                certificateId:
                    certificateId,

                studentName:
                    studentName,

                qualification:
                    qualification,

                institutionName:
                    institutions[
                        institutionWallet
                    ].name,

                documentHash:
                    documentHash,

                issuedBy:
                    msg.sender,

                institutionWallet:
                    institutionWallet,

                issuedAt:
                    block.timestamp,

                revoked:
                    false,

                exists:
                    true,

                updatedAt:
                    block.timestamp,

                version:
                    version,

                status:
                    CertificateStatus.Active,

                revokeReason:
                    "",

                previousCertificateId:
                    previousCertificateId,

                supersededBy:
                    ""
            });

        certificateIdByHash[
            documentHash
        ] = certificateId;

        totalCertificates++;

        emit CertificateIssued(
            certificateId,
            institutionWallet,
            documentHash
        );

        emit AdvancedCertificateIssued(
            certificateId,
            institutionWallet,
            msg.sender,
            documentHash,
            version
        );
    }

    function batchIssueCertificates(
        string[] calldata certificateIds,
        string[] calldata studentNames,
        string[] calldata qualifications,
        bytes32[] calldata documentHashes
    )
        external
        onlyVerifiedIssuer
        whenNotPaused
        nonReentrant
    {
        uint256 length =
            certificateIds.length;

        require(
            length > 0,
            "No certificates supplied"
        );

        require(
            studentNames.length ==
                length &&
            qualifications.length ==
                length &&
            documentHashes.length ==
                length,
            "Array length mismatch"
        );

        address institutionWallet =
            staffInstitution[
                msg.sender
            ];

        for (
            uint256 i = 0;
            i < length;
            i++
        ) {
            _issueCertificate(
                certificateIds[i],
                studentNames[i],
                qualifications[i],
                documentHashes[i],
                institutionWallet,
                1,
                ""
            );
        }
    }

    function revokeCertificate(
        string memory certificateId
    )
        external
        whenNotPaused
    {
        _revokeCertificate(
            certificateId,
            "Revoked by authorised institution"
        );
    }

    function revokeCertificateWithReason(
        string memory certificateId,
        string memory reason
    )
        external
        whenNotPaused
    {
        require(
            bytes(reason).length > 0,
            "Revocation reason required"
        );

        _revokeCertificate(
            certificateId,
            reason
        );
    }

    function _revokeCertificate(
        string memory certificateId,
        string memory reason
    )
        internal
    {
        Certificate storage certificate =
            certificates[
                certificateId
            ];

        require(
            certificate.exists,
            "Certificate does not exist"
        );

        require(
            certificate.status ==
                CertificateStatus.Active,
            "Certificate is not active"
        );

        bool admin =
            hasRole(
                DEFAULT_ADMIN_ROLE,
                msg.sender
            );

        bool institutionRevoker =
            hasRole(
                REVOKER_ROLE,
                msg.sender
            ) &&
            staffInstitution[
                msg.sender
            ] ==
                certificate
                    .institutionWallet &&
            institutions[
                certificate
                    .institutionWallet
            ].status ==
                InstitutionStatus.Verified;

        require(
            admin ||
            institutionRevoker,
            "Not authorised to revoke"
        );

        certificate.status =
            CertificateStatus.Revoked;

        certificate.revoked =
            true;

        certificate.revokeReason =
            reason;

        certificate.updatedAt =
            block.timestamp;

        emit CertificateRevoked(
            certificateId,
            msg.sender
        );

        emit CertificateRevokedWithReason(
            certificateId,
            msg.sender,
            reason
        );
    }

    function reissueCertificate(
        string memory oldCertificateId,
        string memory newCertificateId,
        string memory studentName,
        string memory qualification,
        bytes32 newDocumentHash
    )
        external
        onlyVerifiedIssuer
        whenNotPaused
        nonReentrant
    {
        Certificate storage oldCertificate =
            certificates[
                oldCertificateId
            ];

        require(
            oldCertificate.exists,
            "Old certificate does not exist"
        );

        address institutionWallet =
            staffInstitution[
                msg.sender
            ];

        require(
            oldCertificate
                .institutionWallet ==
                institutionWallet,
            "Certificate belongs to another institution"
        );

        require(
            oldCertificate.status ==
                CertificateStatus.Active,
            "Old certificate is not active"
        );

        oldCertificate.status =
            CertificateStatus.Superseded;

        oldCertificate.supersededBy =
            newCertificateId;

        oldCertificate.updatedAt =
            block.timestamp;

        uint256 newVersion =
            oldCertificate.version + 1;

        _issueCertificate(
            newCertificateId,
            studentName,
            qualification,
            newDocumentHash,
            institutionWallet,
            newVersion,
            oldCertificateId
        );

        certificateHistory[
            oldCertificateId
        ].push(
            newCertificateId
        );

        emit CertificateSuperseded(
            oldCertificateId,
            newCertificateId,
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
            certificates[
                certificateId
            ];

        if (
            !certificate.exists
        ) {
            return (
                false,
                false,
                ""
            );
        }

        bool hashMatches =
            certificate.documentHash ==
                documentHash;

        bool institutionValid =
            institutions[
                certificate
                    .institutionWallet
            ].status ==
                InstitutionStatus.Verified;

        bool active =
            certificate.status ==
                CertificateStatus.Active;

        bool valid =
            hashMatches &&
            active &&
            institutionValid;

        bool revokedStatus =
            certificate.status ==
                CertificateStatus.Revoked;

        return (
            valid,
            revokedStatus,
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
            certificates[
                certificateId
            ].exists,
            "Certificate does not exist"
        );

        return
            certificates[
                certificateId
            ];
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
            institutions[
                institutionWallet
            ];

        return (
            institution.name,
            institution.verified
        );
    }

    function getInstitutionStatus(
        address institutionWallet
    )
        external
        view
        returns (
            InstitutionStatus
        )
    {
        require(
            institutions[
                institutionWallet
            ].exists,
            "Institution does not exist"
        );

        return
            institutions[
                institutionWallet
            ].status;
    }

    function getCertificateStatus(
        string memory certificateId
    )
        external
        view
        returns (
            CertificateStatus
        )
    {
        require(
            certificates[
                certificateId
            ].exists,
            "Certificate does not exist"
        );

        return
            certificates[
                certificateId
            ].status;
    }

    function getCertificateIdByHash(
        bytes32 documentHash
    )
        external
        view
        returns (
            string memory
        )
    {
        return
            certificateIdByHash[
                documentHash
            ];
    }

    function getCertificateHistory(
        string memory certificateId
    )
        external
        view
        returns (
            string[] memory
        )
    {
        return
            certificateHistory[
                certificateId
            ];
    }

    function pauseSystem()
        external
        onlyRole(PAUSER_ROLE)
    {
        _pause();

        emit EmergencyPause(
            msg.sender
        );
    }

    function unpauseSystem()
        external
        onlyRole(PAUSER_ROLE)
    {
        _unpause();

        emit EmergencyUnpause(
            msg.sender
        );
    }
}