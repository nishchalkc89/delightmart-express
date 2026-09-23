export type Product = { id:string; slug:string; name:string; category:string; unit:string; price:number; oldPrice?:number; image:string; discount?:number; stock:number; rating:number; reviews:number; featured?:boolean; isNew?:boolean; description:string };
export type CartLine = { product:Product; quantity:number };
export type OrderStatus = 'Pending'|'Preparing'|'Out for Delivery'|'Delivered'|'Cancelled';
