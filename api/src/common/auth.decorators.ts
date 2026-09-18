import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ALLOW_UNVERIFIED_KEY = 'allowUnverified';
export const AllowUnverified = () => SetMetadata(ALLOW_UNVERIFIED_KEY, true);
