import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Setup global validation pipe
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Set up Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Synthetics Protocol API')
    .setDescription('API documentation for the Synthetics Protocol backend')
    .setVersion('1.0')
    .addTag('market', 'Market data endpoints')
    .addTag('blockchain', 'Blockchain interaction endpoints')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Get port from config or use default
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application running on port ${port}`);
  console.log(
    `Swagger documentation available at http://localhost:${port}/api/docs`,
  );
}
bootstrap();
