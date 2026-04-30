import { Server } from 'http';
import app from './app';
import seedSuperAdmin from './app/DB';
import config from './config';
import { UserServices } from './app/modules/User/user.service';
import { ChapterServices } from './app/modules/Chapter/chapter.service';


const port = config.port || 5000;

async function main() {
  const server: Server = app.listen(port, () => {

    seedSuperAdmin();
    UserServices.createCertificateAutoApproval()
    ChapterServices.createFinalCheckpointChapter()
    
  });
  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.info('Server closed!');
      });
    }
    process.exit(1);
  };

  process.on('uncaughtException', error => {
    console.log(error);
    exitHandler();
  });

  process.on('unhandledRejection', error => {
    console.log(error);
    exitHandler();
  });
}

main();
