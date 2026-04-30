import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import prisma from './prisma';
import { LessonServices } from '../modules/Lesson/lesson.service';

export const generateCertificatePdf = async (
  fullName: string,
  data: {
    name: string;
    date?: Date | null;
    id: string;
  },
  htmlOnly?: any,
): Promise<string> => {
  // 1️⃣ Total Fixed Score বের করা
  const allQuestions = await prisma.question.findMany({
    select: {
      id: true,
      fixedScore: true,
    },
  });

  const totalFixedScore = allQuestions?.reduce(
    (sum, q) => sum + (q?.fixedScore || 0),
    0,
  );

  // 2️⃣ User-এর correct answers এবং score বের করা
  const userCorrectAnswers = await prisma.answer.findMany({
    where: {
      userId: data.id,
      isCorrect: true,
    },
    include: {
      question: {
        select: {
          id: true,
          fixedScore: true,
          title: true,
        },
      },
    },
  });

  const userScore = userCorrectAnswers.reduce(
    (sum, ans: any) => sum + (ans?.question?.fixedScore || 0),
    0,
  );

  // 3️⃣ Percentage বের করা
  // let percentage = 0;
  // if (totalFixedScore > 0) {
  //   percentage = (userScore / totalFixedScore) * 100;
  // }

  const finalCheckPoint = await prisma.lesson.findFirst({
    where: { type: 'FINALCHECHPOINT' },
  });

  const { percentage } = await LessonServices.mycheckPointDtataInDB(
    data.id,
    finalCheckPoint?.id || '',
    'FINALCHECHPOINT',
  );

  // 4️⃣ Grade assign করা
  let grade = '';
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 60) grade = 'C';
  else if (percentage >= 50) grade = 'D';
  else grade = 'F';

  // const browser = await puppeteer.launch({
  //   // executablePath: '/usr/bin/google-chrome',
  //   executablePath: undefined,
  //   headless: true,
  //    args: [
  //   '--no-sandbox',
  //   '--disable-setuid-sandbox',
  //   '--font-render-hinting=full',
  // ],
  // });

  data.date = data.date || new Date();
  // Date format Arabic
  const formattedDate = data.date
    ? new Date(data.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  const formattedPercentage = `${Math.round(percentage)}%`;
  // const regularFontPath = path.resolve('majalla.ttf');
  // const boldFontPath = path.resolve('majallab.ttf');
  // const regularFontPath =
  //   '/var/www/recite-one/najwa_brighach-server/majalla.ttf';
  // const boldFontPath = '/var/www/recite-one/najwa_brighach-server/majalla.ttf';

  const boldFontPath = path.resolve(
    __dirname,
    '../../../public/fonts/majalla.ttf',
  );
  const regularFontPath = path.resolve(
    __dirname,
    '../../../public/fonts/majallab.ttf',
  );

  const regularFontBase64 = fs.readFileSync(regularFontPath).toString('base64');
  const boldFontBase64 = fs.readFileSync(boldFontPath).toString('base64');

  const htmlContent = `
<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>شهادة إتمام مستوى</title>
    
    <style>
      @font-face {
        font-family: 'Majalla';
        src: url('data:font/truetype;charset=utf-8;base64,${regularFontBase64}') format('truetype');
        font-weight: 400;
      }

      @font-face {
        font-family: 'Majalla';
        src: url('data:font/truetype;charset=utf-8;base64,${boldFontBase64}') format('truetype');
        font-weight: 900;
      }

      body {
        font-family: 'Majalla', serif;
        margin: 0;
        padding: 0;
        background: #f0f0f0;
        width: '8.28in';
        height: '11.69in';
        -webkit-text-stroke: 0.22px black;
      }

      * {
        box-sizing: border-box;
      }

      .certificate-container {
        width: 210mm;
        height: 297mm;
        margin: 0 auto;
        position: relative;
        background-image: url('https://res.cloudinary.com/dp73fgjub/image/upload/v1758783419/Certificate_Empty_with_logo_only_ro7vnd.png');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        padding: 0;
        overflow: hidden;
      }

      .text-secondary{
        font-size: 30px;
        color: #333;
        margin-bottom: -6px;
      }

      .mt-20{
        margin-top:-5px;
      }

      .text-lg {
        font-size: 38px;
        color: #333;
        margin-bottom: -30px;
        -webkit-text-stroke: .91px black;
        white-space: nowrap;
        overflow: visible;
        text-overflow: clip;
        width:100000px;
      }

      .text-md {
        font-size: 35px;
        color: #333;
        margin-bottom: -42px;
        -webkit-text-stroke: .6px black;
        white-space: nowrap;
        overflow: visible;
        text-overflow: clip;
        width:100000px;
      }

      li {
        font-size: 35px;
        color: #333;
        -webkit-text-stroke: .3px black;
        white-space: nowrap;
        overflow: visible;
        text-overflow: clip;
      }

      .header {
        text-align: center;
        margin-top: 200px;
      }

      .badge-container {
        text-align: center;
      }

      .skill-header {
        margin-top: 45px;
        -webkit-text-stroke: 0.20px black;
      }

      .certificate-badge {
        width: 100px;
        height: 100px;
      }

      .content {
        padding: 0 42px 0 0px;
        text-align: right;
        margin-top: -45px;

      }

      .presentation-text {
        font-size: 28.5px;
        color: #333;
        margin-bottom: 7px;
      }

      .recipient-name {
        font-size: 46px;
        font-weight: 900;
        color: #1a1a1a;
        margin-bottom: -10px;
      }

      .completion-text {
        font-size: 28.5px;
        color: #333;
        margin-bottom: 0px;
      }

      .course-title {
        font-size: 42px;
        font-weight: 900;
        color: #1a1a1a;
        margin-top: -10px;
        display:hidden;
      }

      .grade-section {
        text-align: right;
        margin-bottom: 0px;
      }

      .grade-label {
        font-size: 36px;
        color: #333;
        margin:0;
      }

      .grade-value {
        font-size: 40px;
        font-weight: 900;
        color: #1a1a1a;
        font-height:.4;
      }

      .date-section {
        font-size: 40px;
        font-weight: bold;
        color: #333;
        margin-bottom: 30px;
      }
      
      .skills-title {
        font-size: 36px;
        color: #333;
        font-weight: 900;
        padding-bottom:0px;
        margin-bottom:-10px;
      }

      .skills-list {
        list-style: none;
        padding: 0;
        margin-right: 25px;
        display: flex;
        flex-direction: column;
        gap: 5px;
        margin-top: -5px;
      }

      .skills-list li {
        font-size: 34px;
        color: #333;
        padding-right: 5px;
        white-space: normal;
        margin-bottom: -10px;
      }

      .skills-list li span.bullet {
        display: inline-block;
        width: 25px;
        color: #333;
        font-size: 42px;
        text-align: right;
      }

      .certificate-title {
        font-size: 90px;
        font-weight: 900;
        color: #1a1a1a;
      }

      .subtitle {
        font-size: 48px;
        color: #333;
        font-weight: 900;
        line-height: .5;
      }

      .certificate-title {
        line-height: 0.8;
        margin: 0;
      }

      .subtitle {
        line-height: 0.7;
        margin: -2px 0 0 0;
      }

      .presentation-text,
      .recipient-name,
      .completion-text,
      .course-title,
      .grade-section,
      .date-section,
      .grade-value,
      .skills-title {
        margin: 0;
        line-height: 1;
      }

      .extra-bold {
        -webkit-text-stroke: 0.5px black;
      }
    </style>
  </head>

  <body style="font-family: 'Majalla', serif; font-weight: bold; font-size: 36px;">
    <div class="certificate-container">
      <div class="header">
        <h1 class="certificate-title extra-bold">شهادة</h1>
        <p class="subtitle extra-bold">Beta Testing Certificate</p>

        <div class="badge-container">
          <img
            src="https://res.cloudinary.com/dp73fgjub/image/upload/v1758788326/certificate_icon_uavueg.png"
            alt="Certificate Badge"
            class="certificate-badge"
          />
        </div>
      </div>

      <div class="content">
        <p class="text-secondary">تُقدَّم هذه الشهادة إلى:</p>
        <div class="text-lg">${fullName}</div>
        <p class="text-secondary">الذي أتمَّ (ت) بنجاح:</p>
        <div class="text-lg">المستوى المبتدئ من رواية ورش عن نافع من طريق الأزرق.</div>

        <p class="text-secondary">الدرجة المحصَّلة:</p>
        <div class="text-lg">[${formattedPercentage}]</div>

        <p class="text-lg" style="margin-top: 25px;">
          مُنِحت في ${formattedDate} من قِبَل Recite One.
        </p>

        <div style="margin-top: 58px;" class="mt-20">
          <p class="text-md" style="margin:0px 0 0 0;">وقد أظهر (ت) المتعلم (ة) القدرة على:</p>
          <ul class="skills-list">
            <li><span class="bullet">•</span> فهم المبادئ الأساسية لعلم التجويد.</li>
            <li><span class="bullet">•</span> التعريف برواية ورش عن نافع من طريق الأزرق.</li>
            <li><span class="bullet">•</span> إدراك أحكام النون الساكنة والتنوين.</li>
            <li><span class="bullet">•</span> التمييز بين أحكام الميم الساكنة الأصلية وميم الجمع.</li>
            <li><span class="bullet">•</span> معرفة مواضع التفخيم والترقيق - أحكام اللام والراء.</li>
          </ul>
        </div>
      </div>
    </div>
  </body>
</html>
`;

  // … rest of your code unchanged

  // if (htmlOnly) return htmlContent;

  const browser = await puppeteer.launch({
    ...(process.env.NODE_ENV == 'production' && {
      executablePath: '/usr/bin/google-chrome-stable',
    }), // step 2 এর Chrome
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--font-render-hinting=full',
      '--disable-font-subpixel-positioning',
    ],
  });

  const page = await browser.newPage();

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');

  const filePath = path.join(
    __dirname,
    `../../uploads/certificate-${Date.now()}.pdf`,
  );

  await page.pdf({
    path: filePath,
    width: '8.28in',
    height: '11.69in',
    printBackground: true,
    margin: {
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px',
    },
  });

  await browser.close();

  return filePath;
};
