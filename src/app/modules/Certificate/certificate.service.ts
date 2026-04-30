import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { generateCertificatePdf } from '../../utils/generateCertificatePdf';
import prisma from '../../utils/prisma';
import Email from '../../utils/sendMail';

// const sendCertificateRequest = async (
//   userId: string,
//   email: string,
//   fullName: string,
// ) => {
//   // 1️⃣ User খুঁজে বের করো
//   const user: any = await prisma.user.findUnique({ where: { id: userId } });
//   if (!user) throw new Error('User not found');

//   // 2️⃣ Admin setting check
//   const adminSetting = await prisma.adminSetting.findFirst();
//   const autoApproval = adminSetting?.certificateAutoApproval;

//   // 3️⃣ DB তে Pending হিসেবে create/update
//   let certificate = await prisma.certificate.findUnique({ where: { userId } });

//   if (!certificate) {
//     certificate = await prisma.certificate.create({
//       data: {
//         userId: user.id,
//         status: 'PENDING',
//         email: user.email,
//       },
//     });
//   } else {
//     certificate = await prisma.certificate.update({
//       where: { id: certificate.id },
//       data: { status: 'PENDING' },
//     });
//   }

//   // 4️⃣ PDF Generate (local path)
//   const pdfPath = await generateCertificatePdf(fullName, user);

//   try {
//     // 5️⃣ Upload to /api/v1/upload
//     const formData = new FormData();
//     formData.append('upload', fs.createReadStream(pdfPath), 'certificate.pdf');

//     const uploadResponse = await axios.post(
//       `${process.env.API_BASE_URL}/api/v1/upload`,
//       formData,
//       {
//         headers: formData.getHeaders(),
//         maxContentLength: Infinity,
//         maxBodyLength: Infinity,
//         timeout: 300000, // ⏳ 5 minutes timeout
//       },
//     );

//     if (!uploadResponse.data.success) throw new Error('File upload failed');

//     const fileUrl = uploadResponse.data.url;

//     // 6️⃣ Update certificate content
//     certificate = await prisma.certificate.update({
//       where: { id: certificate.id },
//       data: { content: fileUrl },
//     });

//     // 7️⃣ AutoApproval → email পাঠাও + status APPROVE
//     console.log(fileUrl, 'Uploaded file URL');
//     if (autoApproval && email) {
//       user.email = email;
//       const emailService = new Email(user);
//       await emailService.sendCustomEmail(
//         '🎉 شهادتك جاهزة!',
//         `السلام عليكم ورحمة الله وبركاته ${fullName}،<br/>
//   تهانينا! 🎓<br/>
//   بفضل الله أتممت بنجاح المستوى المبتدئ من رواية ورش عن نافع.<br/>
//   <a href="${fileUrl}" target="_blank">تحميل الشهادة</a>`,
//       );

//       certificate = await prisma.certificate.update({
//         where: { id: certificate.id },
//         data: { status: 'APPROVE' },
//       });
//     }

//     return certificate;
//   } finally {
//     // ✅ Upload শেষে local PDF ফাইল delete
//     fs.unlink(pdfPath, err => {
//       if (err) console.error('Failed to delete local PDF:', err);
//       else console.log('Local PDF deleted:', pdfPath);
//     });
//   }
// };

// _____________________


const sendCertificateRequest = async (
  userId: string,
  email: string,
  fullName: string,
) => {
 

  await prisma.user.update({

    where:{id:userId},
    data:{
      certificateEmail:email,
      certificateName:fullName
    }
  })
let message='';
  // 1️⃣ User খুঁজে বের করো
  const user: any = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  

  // 2️⃣ Admin setting check
  const adminSetting = await prisma.adminSetting.findFirst();
  const autoApproval = adminSetting?.certificateAutoApproval;
  

  // 3️⃣ DB তে Pending হিসেবে create/update
  let certificate = await prisma.certificate.findUnique({ where: { userId } });

  if (!certificate) {
    certificate = await prisma.certificate.create({
      data: {
        userId: user.id,
        status: 'PENDING',
        email: user.email,
      },
    });
    
  } else {
    certificate = await prisma.certificate.update({
      where: { id: certificate.id },
      data: { status: 'PENDING' },
    });
  
  }

  // 4️⃣ PDF Generate (local path)
 
  const pdfPath = await generateCertificatePdf(fullName, user,);
  

  try {
    // 5️⃣ Upload to /api/v1/upload

    const formData = new FormData();
    formData.append('upload', fs.createReadStream(pdfPath), 'certificate.pdf');

    const uploadResponse = await axios.post(
      `${process.env.API_BASE_URL}/api/v1/upload`,
      formData,
      {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 300000, // 5 minutes
      },
    );


    if (!uploadResponse.data.success) throw new Error('File upload failed');

    const fileUrl = uploadResponse.data.url;
    

    // 6️⃣ Update certificate content
    certificate = await prisma.certificate.update({
      where: { id: certificate.id },
      data: { content: fileUrl },
    });

    // 7️⃣ AutoApproval → email পাঠাও + status APPROVE
    if (autoApproval && email) {
      
      user.email = email;

      const emailService = new Email(user);
      await emailService.sendCustomEmail(
        '🎉 شهادتك جاهزة!',
        `السلام عليكم ورحمة الله وبركاته ${fullName}،<br/>
        تهانينا! 🎓<br/>
        بفضل الله أتممت بنجاح المستوى المبتدئ من رواية ورش عن نافع.<br/>
        <a href="${fileUrl}" target="_blank">تحميل الشهادة</a>`,
      );
   
      certificate = await prisma.certificate.update({
        where: { id: certificate.id },
        data: { status: 'APPROVE' },
      });

        message=`✅ Certificate approved & email sent to: ${email}`;
    } else {

      message=`✅ Certificate not approved . Admin willbe approve soon`;
    }

   await prisma.user.update({
    where: { id: userId },
    data: {
      progressStatus:"COMPLETE"
      
    },
  });



    return {certificate,message};
  } finally {
    // ✅ Upload শেষে local PDF ফাইল delete
    fs.unlink(pdfPath, err => {
      if (err) console.error('❌ Failed to delete local PDF:', err);
      else console.log('🧹 Local PDF deleted:', pdfPath);
    });
  }
};

const approveCertificate = async (certificateId: string) => {
  // 1️⃣ Certificate check
  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateId },
    include: { user: true },
  });

  if (!certificate) {
    throw new AppError(httpStatus.NOT_FOUND, 'Certificate not found!');
  }

  if (certificate.status === 'APPROVE') {
    throw new AppError(httpStatus.OK, 'Certificate already approved');
  }

  // 2️⃣ Update certificate status
  const updatedCertificate = await prisma.certificate.update({
    where: { id: certificateId },
    data: { status: 'APPROVE' },
  });

  // 3️⃣ Send email to user
  const user = certificate.user;

  if (certificate.email) {
    user.email = certificate.user.certificateEmail;
    const emailService = new Email(user);
    await emailService.sendCustomEmail(
      '🎉 شهادتك جاهزة!',
        `السلام عليكم ورحمة الله وبركاته ${user.certificateName}،<br/>
        تهانينا! 🎓<br/>
        بفضل الله أتممت بنجاح المستوى المبتدئ من رواية ورش عن نافع.<br/>
        <a href="${certificate.content}" target="_blank">تحميل الشهادة</a>`,

    );
  }


  return updatedCertificate;
};

const getAllCertificates = async (search?: string) => {
  return await prisma.certificate.findMany({
    where: search
      ? {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          },
        }
      : {}, // search না থাকলে সব data
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
};

const getCertificatesByUser = async (userId: string) => {
  return await prisma.certificate.findMany({
    where: { userId },
    // orderBy: { issuedAt: 'desc' },
  });
};

export const CertificateServices = {
  sendCertificateRequest,
  getAllCertificates,
  getCertificatesByUser,
  approveCertificate,
};
