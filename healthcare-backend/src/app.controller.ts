import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { FirebaseGuard } from './firebase/firebase.guard'; 

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @UseGuards(FirebaseGuard) 
  getHello(@Request() req): string { 
    const userId = req.user.uid;
    const userEmail = req.user.email;
    console.log(`Request received from authenticated user: ${userId} (${userEmail})`);
    return `Hello authenticated user ${userId}! Service says: ${this.appService.getHello()}`;
  }
}
