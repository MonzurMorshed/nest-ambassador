import {
    BadRequestException,
    Body, ClassSerializerInterceptor,
    Controller,
    Get,
    Post, Put,
    Req,
    Res, UseGuards,
    UseInterceptors
} from '@nestjs/common';
import { RegisterDto } from "./dtos/register.dto";
import { UserService } from "./user.service";
import { JwtService } from "@nestjs/jwt";
import { Response, Request } from "express";
import { AuthGuard } from "./auth.guard";
import axios from 'axios';
import { User } from './user.decorator';

@Controller()
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {

    constructor(
        private userService: UserService    ) {
    }

    @Post(['admin/register', 'ambassador/register'])
    async register(
        @Body() body: RegisterDto,
        @Req() request: Request
    ) {
        return this.userService.post('register', {
            ...body,
            is_ambassador: request.path === '/api/ambassador/register'
        });
    }

    @Post(['admin/login', 'ambassador/login'])
    async login(
        @Body('email') email: string,
        @Body('password') password: string,
        @Res({ passthrough: true }) response: Response,
        @Req() request: Request
    ) {
        const resp = await this.userService.post('login', {
            email,
            password,
            scope: request.path === '/api/admin/login' ? 'admin' : 'ambassador'
        });

        response.cookie('jwt', resp['jwt'], { httpOnly: true });

        return {
            message: 'success'
        };
    }

    @Get(['admin/user', 'ambassador/user'])
    async user(@User() user) {
        return user;
    }

    @UseGuards(AuthGuard)
    @Post(['admin/logout', 'ambassador/logout'])
    async logout(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response) {

        const cookie = request.cookies['jwt'];

        await this.userService.post('http://host.docker.internal:8001/api/logout', request.cookies['jwt']);

        response.clearCookie('jwt');

        return {
            message: 'success'
        }
    }

    @UseGuards(AuthGuard)
    @Put(['admin/users/info', 'ambassador/users/info'])
    async updateInfo(
        @Req() request: Request,
        @Body('first_name') first_name: string,
        @Body('last_name') last_name: string,
        @Body('email') email: string,
    ) {
        const cookie = request.cookies['jwt'];

        return this.userService.put('users/info', {
                first_name,
                last_name,
                email,
            }, request.cookies['jwt']
        );

    }

    @UseGuards(AuthGuard)
    @Put(['admin/users/password', 'ambassador/users/password'])
    async updatePassword(
        @Req() request: Request,
        @Body('password') password: string,
        @Body('password_confirm') password_confirm: string,
    ) {

        return this.userService.put('users/password', {
                password,
                password_confirm
            },request.cookies['jwt']
        );
    }
}
