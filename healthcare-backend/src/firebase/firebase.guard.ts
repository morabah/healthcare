import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { FirebaseService } from './firebase.service';

@Injectable()
export class FirebaseGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseGuard.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
        this.logger.warn('Missing Authorization header');
      throw new UnauthorizedException('Authorization header is missing.');
    }

    const [bearer, token] = authorizationHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
        this.logger.warn('Invalid Authorization header format');
      throw new UnauthorizedException('Invalid Authorization header format. Expected \"Bearer <token>\".');
    }

    return this.validateToken(token, request);
  }

  async validateToken(token: string, request: any): Promise<boolean> {
    try {
      const decodedToken = await this.firebaseService.verifyToken(token);
      // Attach the decoded user information to the request object
      // This allows controllers to access user details (e.g., uid)
      request.user = decodedToken;
      this.logger.log(`Token verified successfully for UID: ${decodedToken.uid}`);
      return true;
    } catch (error) {
      this.logger.error(`Token validation failed: ${error.message}`);
      // Throw UnauthorizedException to deny access
      throw new UnauthorizedException(error.message || 'Invalid or expired authentication token.');
    }
  }
}
