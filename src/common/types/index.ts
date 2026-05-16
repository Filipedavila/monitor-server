export interface AuditUser {
  id: number;
  username: string;
}

export interface UserSession {
  id: number;
  username: string;
  role: string;
}

export interface BaseUser {
  id: number;      
  username: string;     
  email: string;       
  fullName?: string;    
  uniqueHash: string;   
}

export interface BaseWebsite {
  id: number;
  title: string;
  baseUrl: string;
  declarationStatus: number;
  stampStatus: number;

}