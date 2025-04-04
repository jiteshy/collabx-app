import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EditorGateway } from './gateways/editor.gateway';
import { SessionModule } from './modules/session.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SessionModule,
  ],
  controllers: [],
  providers: [EditorGateway],
})
export class AppModule {}
