import {createContext,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';
import type {User} from '@supabase/supabase-js';
import {supabase} from '@/services/supabase';

type AuthValue={user:User|null;loading:boolean;displayName:string;signOut:()=>Promise<void>};
const AuthContext=createContext<AuthValue|undefined>(undefined);
export function AuthProvider({children}:{children:ReactNode}){const [user,setUser]=useState<User|null>(null);const [loading,setLoading]=useState(true);useEffect(()=>{if(!supabase){setLoading(false);return}void supabase.auth.getUser().then(({data})=>{setUser(data.user);setLoading(false)});const {data}=supabase.auth.onAuthStateChange((_event,session)=>{setUser(session?.user??null);setLoading(false)});return()=>data.subscription.unsubscribe()},[]);const value=useMemo<AuthValue>(()=>({user,loading,displayName:String(user?.user_metadata['full_name']??user?.email?.split('@')[0]??'Account'),signOut:async()=>{if(supabase)await supabase.auth.signOut();setUser(null)}}),[user,loading]);return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('useAuth requires AuthProvider');return value}