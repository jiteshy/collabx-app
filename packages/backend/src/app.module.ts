import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EditorGateway } from './gateways/editor.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [],
  providers: [EditorGateway],
})
export class AppModule {}
