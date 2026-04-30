import fs from 'fs';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { generateCertificatePdf } from '../../utils/generateCertificatePdf';
import sendResponse from '../../utils/sendResponse';
import { CertificateServices } from './certificate.service';

const sendCertificateRequest = catchAsync(async (req, res) => {
  const result = await CertificateServices.sendCertificateRequest(
    req.user.userId,
    req.body.email,
    req.body?.fullName,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: result.message,
    data: result.certificate,
  });
});

const approveCertificate = catchAsync(async (req, res) => {
  const result = await CertificateServices.approveCertificate(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Approve Certificate request  successfully',
    data: result,
  });
});

const getAll = catchAsync(async (req, res) => {
  const { search } = req.query; // query string থেকে search নিলাম
  const result = await CertificateServices.getAllCertificates(search as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'All certificates fetched',
    data: result,
  });
});

const htmlPreview = catchAsync(async (req, res) => {
  const fullName = 'محمد أحمد'; // test data
  const data = { id: 'demo', date: new Date() };

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
});

// 🧠 Generate the actual PDF and show it in browser
const pdfPreview = catchAsync(async (req, res) => {
  const fullName = 'محمد أحمد'; // test data
  const data = { id: 'demo', date: new Date(), name: fullName };

  const pdfPath = await generateCertificatePdf(fullName, data);

  res.setHeader('Content-Type', 'application/pdf');

  const fileStream = fs.createReadStream(pdfPath);
  fileStream.pipe(res);

  fileStream.on('end', () => {
    fs.unlink(pdfPath, err => {
      if (err) console.error('Failed to delete temp PDF:', err);
    });
  });
});

const getByUser = catchAsync(async (req, res) => {
  const result = await CertificateServices.getCertificatesByUser(
    req.params.userId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User certificates fetched',
    data: result,
  });
});

export const CertificateControllers = {
  sendCertificateRequest,
  getAll,
  getByUser,
  htmlPreview,
  pdfPreview,
  approveCertificate,
};
