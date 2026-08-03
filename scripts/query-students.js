const{PrismaClient}=require('@prisma/client');
const{PrismaPg}=require('@prisma/adapter-pg');
const{Pool}=require('pg');
require('dotenv').config();
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:2});
const adapter=new PrismaPg(pool);
const p=new PrismaClient({adapter});
p.student.findMany({
  where:{isActive:true,studyMode:'ONSITE_SUMMER'},
  select:{id:true,fullName:true,summerGroup:true,studentCode:true,teacherId:true},
  orderBy:{fullName:'asc'}
}).then(s=>{
  console.log(JSON.stringify(s));
  p.$disconnect();
  pool.end();
}).catch(e=>{console.error(e);process.exit(1)});
