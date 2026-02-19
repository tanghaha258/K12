import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { GradesModule } from './modules/grades/grades.module';
import { ClassesModule } from './modules/classes/classes.module';
import { StudentsModule } from './modules/students/students.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { DormsModule } from './modules/dorms/dorms.module';
import { RolesModule } from './modules/roles/roles.module';
import { DictModule } from './modules/dict/dict.module';
import { DataScopeModule } from './modules/datascope/datascope.module';
import { ScoreSegmentsModule } from './modules/score-segments/score-segments.module';
import { ScoreLinesModule } from './modules/score-lines/score-lines.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    GradesModule,
    ClassesModule,
    StudentsModule,
    TeachersModule,
    DormsModule,
    RolesModule,
    DictModule,
    DataScopeModule,
    ScoreSegmentsModule,
    ScoreLinesModule,
  ],
})
export class AppModule {}
