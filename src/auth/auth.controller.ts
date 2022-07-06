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
import { UserService } from "../user/user.service";
import { JwtService } from "@nestjs/jwt";
import { Response, Request } from "express";
import { AuthGuard } from "./auth.guard";
import axios from 'axios';

@Controller()
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {

    constructor(
        private userService: UserService,
        private jwtService: JwtService
    ) {
    }

    @Post(['admin/register', 'ambassador/register'])
    async register(
        @Body() body: RegisterDto,
        @Req() request: Request
    ) {
        const response = await axios.post('http://host.docker.internal:8001/api/register', {
            ...body,
            is_ambassador: request.path === '/api/ambassador/register'
        });

        return response.data;
    }

    @Post(['admin/login', 'ambassador/login'])
    async login(
        @Body('email') email: string,
        @Body('password') password: string,
        @Res({ passthrough: true }) response: Response,
        @Req() request: Request
    ) {
        const resp = await axios.post('http://host.docker.internal:8001/api/login', {
            email,
            password,
            scope: request.path === '/api/admin/login' ? 'admin' : 'ambassador'
        });

        response.cookie('jwt', resp.data['jwt'], { httpOnly: true });

        return {
            message: 'success'
        };
    }

    @UseGuards(AuthGuard)
    @Get(['admin/user', 'ambassador/user'])
    async user(@Req() request: Request) {
        const cookie = request.cookies['jwt'];
        console.log(cookie);
        const resp = await axios.get('http://host.docker.internal:8001/api/user', {
            headers: {
                'Cookie': `jwt=${cookie}`
            }
        });

        return resp.data;

        // const {id} = await this.jwtService.verifyAsync(cookie);

        // if (request.path === '/api/admin/user') {
        //     return this.userService.findOne({id});
        // }

        // const user = await this.userService.findOne({
        //     id,
        //     relations: ['orders', 'orders.order_items']
        // });

        // const {orders, password, ...data} = user;

        // return {
        //     ...data,
        //     revenue: user.revenue
        // }
    }

    @UseGuards(AuthGuard)
    @Post(['admin/logout', 'ambassador/logout'])
    async logout(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response) {

        const cookie = request.cookies['jwt'];

        await axios.post('http://host.docker.internal:8001/api/logout', {}, {
            headers: {
                'Cookie': `jwt=${cookie}`
            }
        });

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

        const resp = await axios.put('http://host.docker.internal:8001/api/users/info', {
            first_name,
            last_name,
            email
        }, {
            headers: {
                'Cookie': `jwt=${cookie}`
            }
        });

        return resp.data;
    }

    @UseGuards(AuthGuard)
    @Put(['admin/users/password', 'ambassador/users/password'])
    async updatePassword(
        @Req() request: Request,
        @Body('password') password: string,
        @Body('password_confirm') password_confirm: string,
    ) {
        if (password !== password_confirm) {
            throw new BadRequestException('Passwords do not match!');
        }

        const cookie = request.cookies['jwt'];

        const { id } = await this.jwtService.verifyAsync(cookie);

        const resp = await axios.put('http://host.docker.internal:8001/api/users/password', {
            password,
            password_confirm
        }, {
            headers: {
                'Cookie': `jwt=${cookie}`
            }
        });

        return this.userService.findOne({ id });
    }
}
