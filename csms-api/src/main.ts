import { createApplication } from './bootstrap';

async function bootstrap() {
  const app = await createApplication();
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`CSMS API is running on port ${port}`);
}
bootstrap();
