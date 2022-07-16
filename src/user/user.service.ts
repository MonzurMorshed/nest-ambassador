import axios, { Method } from 'axios';

export class UserService {


    baseURL = 'http://host.docker.internal:8001/api';

    async request(method: Method, url: string, data:{} = {}, cookie:string = '' ){
        let headers = {};

        if(cookie != ''){
            headers = {
                'Cookie': `jwt=${cookie}`
            };
        }

        try{
            const response = await axios.request({
                method,
                url,
                baseURL: this.baseURL,
                headers,
                data
            });
    
            return response.data;
        }catch(e){
            return e.response.data;
        }

    }

    async post(url, data: any, cookie:string = '' ){
        return this.request('post',url,data,cookie);
    }

    async put(url, data: any, cookie:string = '' ){
        return this.request('put',url,data,cookie);
    }

    async get(url, data: {}, cookie:string = '' ){
        return this.request('get',url,{},cookie);
    }
}
