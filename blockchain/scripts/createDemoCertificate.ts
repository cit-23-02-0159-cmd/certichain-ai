import { network } from "hardhat";
import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";
import {
  mkdir,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

const CONTRACT_ADDRESS =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
  const { ethers } = await network.connect();

  const [, institution] = await ethers.getSigners();

  const certificateId = "CCA-2026-0160";
  const studentName = "Volga Indeewari Gunasekara";
  const qualification =
    "BSc (Hons) Software Engineering";
  const institutionName =
    "SLTC Research University";

  const pdfDocument = await PDFDocument.create();

  pdfDocument.setTitle(
    "CertiChain Academic Certificate"
  );

  pdfDocument.setAuthor(institutionName);
  pdfDocument.setSubject(qualification);

  const page = pdfDocument.addPage([842, 595]);

  const regularFont =
    await pdfDocument.embedFont(
      StandardFonts.Helvetica
    );

  const boldFont =
    await pdfDocument.embedFont(
      StandardFonts.HelveticaBold
    );

  const purple = rgb(0.38, 0.25, 0.9);
  const blue = rgb(0.2, 0.46, 0.9);
  const dark = rgb(0.08, 0.12, 0.23);
  const grey = rgb(0.42, 0.46, 0.56);
  const light = rgb(0.96, 0.96, 1);
  const green = rgb(0.08, 0.58, 0.38);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: 842,
    height: 595,
    color: light,
  });

  page.drawRectangle({
    x: 20,
    y: 20,
    width: 802,
    height: 555,
    borderColor: purple,
    borderWidth: 3,
  });

  page.drawRectangle({
    x: 32,
    y: 32,
    width: 778,
    height: 531,
    borderColor: blue,
    borderWidth: 1,
  });

  page.drawCircle({
    x: 421,
    y: 505,
    size: 32,
    color: purple,
  });

  page.drawText("C", {
    x: 409,
    y: 493,
    size: 26,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  const drawCenteredText = (
    text: string,
    y: number,
    size: number,
    font: typeof regularFont,
    color = dark
  ) => {
    const textWidth =
      font.widthOfTextAtSize(text, size);

    page.drawText(text, {
      x: (842 - textWidth) / 2,
      y,
      size,
      font,
      color,
    });
  };

  drawCenteredText(
    "CERTICHAIN AI",
    445,
    15,
    boldFont,
    purple
  );

  drawCenteredText(
    "ACADEMIC CERTIFICATE",
    410,
    18,
    boldFont,
    grey
  );

  drawCenteredText(
    "Certificate of Achievement",
    355,
    34,
    boldFont,
    dark
  );

  drawCenteredText(
    "This certificate is proudly presented to",
    315,
    13,
    regularFont,
    grey
  );

  drawCenteredText(
    studentName,
    267,
    29,
    boldFont,
    purple
  );

  page.drawLine({
    start: { x: 230, y: 250 },
    end: { x: 612, y: 250 },
    thickness: 1,
    color: purple,
  });

  drawCenteredText(
    "for successfully completing",
    220,
    13,
    regularFont,
    grey
  );

  drawCenteredText(
    qualification,
    180,
    22,
    boldFont,
    dark
  );

  drawCenteredText(
    `Issued by ${institutionName}`,
    140,
    14,
    regularFont,
    dark
  );

  page.drawText(
    `Certificate ID: ${certificateId}`,
    {
      x: 65,
      y: 75,
      size: 12,
      font: boldFont,
      color: dark,
    }
  );

  page.drawText("Blockchain Secured", {
    x: 350,
    y: 75,
    size: 12,
    font: boldFont,
    color: green,
  });

  page.drawText("Status: Active", {
    x: 680,
    y: 75,
    size: 12,
    font: boldFont,
    color: green,
  });

  const pdfBytes = await pdfDocument.save({
    useObjectStreams: false,
  });

  const outputDirectory = path.join(
    process.cwd(),
    "demo-certificates"
  );

  await mkdir(outputDirectory, {
    recursive: true,
  });

  const outputPath = path.join(
    outputDirectory,
    `${certificateId}.pdf`
  );

  await writeFile(outputPath, pdfBytes);

  const documentHash = ethers.sha256(pdfBytes);

  console.log("Demo PDF generated:");
  console.log(outputPath);
  console.log("PDF SHA-256 hash:");
  console.log(documentHash);

  const certiChainRegistry =
    await ethers.getContractAt(
      "CertiChainRegistry",
      CONTRACT_ADDRESS,
      institution
    );

  console.log(
    "Registering PDF hash on blockchain..."
  );

  const transaction =
    await certiChainRegistry.issueCertificate(
      certificateId,
      studentName,
      qualification,
      documentHash
    );

  await transaction.wait();

  console.log(
    "Demo certificate issued successfully!"
  );

  console.log(
    "Transaction hash:",
    transaction.hash
  );

  console.log(
    "Use Certificate ID:",
    certificateId
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});