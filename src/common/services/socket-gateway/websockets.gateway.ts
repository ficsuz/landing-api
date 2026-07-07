import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { BadRequestException, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { GatewayAuthService } from './gateway-auth.service';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { IMySocket, SocketResponse } from './interfaces';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})
export class WebsocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(WebsocketsGateway.name);

  constructor(
    private readonly gatewayAuthService: GatewayAuthService,
    private readonly prisma: PrismaService,
  ) {}

  @WebSocketServer() server: Server;

  private handleSocketError(socket: IMySocket, error: unknown, shouldDisconnect = true) {
    const errorMessage =
      error instanceof Error ? error.message : error?.toString() || 'Unknown error';

    this.logger.error(`Socket error [${socket.id}]:`, errorMessage);

    socket.emit('error', {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    if (shouldDisconnect) {
      socket.disconnect();
    }
  }

  emitTest(): void {
    this.server.emit('test', {
      success: true,
      data: 'test message',
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(socket: IMySocket): void {
    this.logger.log(`Socket disconnected: ${socket.id}`);

    // Clean up any rooms the socket was in
    if (socket.user?.id) {
      socket.leave(socket.user.id.toString());
    }
  }

  async handleConnection(socket: IMySocket) {
    this.logger.log(`New socket connection attempt: ${socket.id}`);

    try {
      const jwt =
        socket?.handshake?.headers?.authorization?.toString() ||
        socket?.handshake?.auth?.token?.toString();

      if (!jwt) {
        this.logger.warn(`No authorization token provided for socket: ${socket.id}`);
        throw new BadRequestException('Authorization token should be provided');
      }

      const userSession = await this.gatewayAuthService.verifyTokenAndSetUser(jwt, socket);

      const user = await this.prisma.users.findUnique({
        where: {
          id: userSession.id,
          isDeleted: false,
        },
        select: {
          id: true,
          email: true,
          isDeleted: true,
        },
      });

      if (!user) {
        this.logger.warn(`User not found or deleted for socket: ${socket.id}`);
        throw new UnauthorizedException('Invalid token or user not found');
      }

      // Join organization room
      await socket.join(user.id.toString());

      // Send connection success message
      socket.emit('connected', {
        success: true,
        data: {
          userId: user.id,
          socketId: socket.id,
        },
        message: 'Successfully connected to WebSocket',
      });
    } catch (error) {
      this.logger.error(`Connection failed for socket ${socket.id}:`, error.message);
      this.handleSocketError(socket, error);
    }
  }

  // Utility method to emit to specific organization
  emitToOrganization(organizationId: string, event: string, data: unknown): void {
    this.server.to(organizationId.toString()).emit(event, {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // Utility method to emit to specific room
  emitToRoom(roomId: string, event: string, data: unknown): void {
    this.server.to(roomId).emit(event, {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.server.sockets.sockets.size;
  }

  // Get clients in specific room
  getClientsInRoom(roomId: string): string[] {
    const room = this.server.sockets.adapter.rooms.get(roomId);
    return room ? Array.from(room) : [];
  }

  disconnectChatMembers(organizationId: string) {
    try {
      const room = this.server.sockets.adapter.rooms.get(organizationId.toString());
      if (!room) {
        this.logger.warn(`Room not found: ${organizationId}`);
        return;
      }

      room.forEach((socketId) => {
        const client = this.server.sockets.sockets.get(socketId);
        if (!client) {
          this.logger.warn(`Client not found: ${socketId}`);
          return;
        }
        client.disconnect();
        this.logger.log(`Member ${socketId} of organization ${organizationId} disconnected`);
      });
    } catch (error) {
      this.logger.error(`Failed to disconnect organization members:`, error);
    }
  }

  // Processing queue events. The payload shape is owned by the jobs module
  // (a step status update); kept generic here so the gateway stays decoupled.
  emitToProcessingQueue(roomId: string, data: unknown): void {
    this.emitToRoom(roomId, 'processingQueue', data);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() socket: IMySocket): SocketResponse<string> {
    this.logger.log(`Ping received from socket: ${socket.id}`);

    const data = {
      success: true,
      data: 'pong',
      message: 'Connection is alive',
    };

    socket.emit('pong', data);
    return data;
  }
}
