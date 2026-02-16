export interface UserProfileResponseDto {
    avatar_Id: string;
    gender: string;
    name: string;
    registration: string;
    league_Id: string;
}

export interface UserPowerResponseDto {
    games: number;
    miners: number;
    max_Power: number;
    current_Power: number;
    decrease: number;
    temp: number;
    racks: number;
    bonus: number;
}

export interface RollercoinUserResponse {
    userProfileResponseDto: UserProfileResponseDto;
    userPowerResponseDto: UserPowerResponseDto;
}
