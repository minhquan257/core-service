import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('core-service')
    .setDescription('The core-service API')
    .setVersion('1.0')
    .addTag('core-service')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);


  app.use(helmet({
    hsts: {
      maxAge: 31536000, // 1 năm
      includeSubDomains: true,
      preload: true,
    },
  }));

  app.enableCors({
    origin: true, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  SwaggerModule.setup('', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
