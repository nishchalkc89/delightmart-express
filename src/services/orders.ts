import type {CartLine} from '@/types/store';
import type {DeliveryDetails,PaymentMethod} from '@/components/delight/checkout-context';
import {supabase} from './supabase';

export type StoredOrder={id:string;orderNumber:string;status:string;subtotal:number;discount:number;total:number;paymentMethod:PaymentMethod;details:DeliveryDetails;lines:CartLine[];createdAt:string};
export async function placeOrder(input:{userId:string;lines:CartLine[];subtotal:number;discount:number;paymentMethod:PaymentMethod;details:DeliveryDetails;coupon?:string}){
  if(input.paymentMethod!=='COD')throw new Error('Online payment is not available yet');
  const {data,error}=await supabase.rpc('place_cod_order',{p_items:input.lines.map(line=>({slug:line.product.slug,quantity:line.quantity})),p_address:input.details,p_coupon:input.coupon||null});
  if(error)throw new Error(error.message);
  if(!data)throw new Error('Unable to place your order');
  return {id:data};
}
export async function getMyOrders(userId:string){const {data,error}=await supabase.from('orders').select('id,order_number,status,subtotal,discount,delivery_fee,total,payment_method,delivery_instructions,created_at,estimated_delivery_at,order_items(product_name,quantity,unit_price,line_total,product_id)').eq('user_id',userId).order('created_at',{ascending:false});if(error)throw error;return data??[]}