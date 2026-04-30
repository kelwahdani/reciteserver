import express from 'express';
import { CertificateControllers } from './certificate.controller';
import validateRequest from '../../middlewares/validateRequest';
import { CertificateValidation } from './certificate.validation';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post(
  '/send-certificate-request',
  auth('USER'),
  validateRequest(CertificateValidation.create),
  CertificateControllers.sendCertificateRequest,
);
router.patch(
  '/approve-certificate/:id',
  auth('ADMIN', 'SUPERADMIN'),

  CertificateControllers.approveCertificate,
);

router.get('/', auth('ADMIN', 'SUPERADMIN'), CertificateControllers.getAll);
router.get('/get-preview/pdf', CertificateControllers.pdfPreview);
router.get('/get-preview/html', CertificateControllers.htmlPreview);
router.get(
  '/user/:userId',
  auth('USER', 'ADMIN', 'SUPERADMIN'),
  CertificateControllers.getByUser,
);

export const CertificateRouters = router;
