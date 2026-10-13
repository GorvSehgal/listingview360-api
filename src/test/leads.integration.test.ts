import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword } from "../services/auth.service.js";

test("viewing requests stay private to realtor owner and analytics follow approval", {
  skip: process.env.RUN_DB_TESTS !== "true",
}, async () => {
  const { default: app } = await import("../app.js");
  const { prisma } = await import("../config/database.js");
  const server = app.listen(0);
  await new Promise<void>(resolve => server.once("listening", resolve));
  const address = server.address(); assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api/v1`;
  const userIds: number[] = [], propertyIds: number[] = [];
  const pass = "secure-test-leads-password-2026";
  const emailA = "ci-leads-owner@listingview360.example", emailB = "ci-leads-other@listingview360.example";
  async function request(method: string, url: string, body?: unknown, token?: string) {
    const res = await fetch(base+url, {method,headers:{
      ...(body ? {"Content-Type":"application/json"} : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }, ...(body ? { body:JSON.stringify(body) } : {})});
    return { status:res.status, body:await res.json() as any };
  }
  try {
    const passwordHash=await hashPassword(pass);
    const a=await prisma.user.create({data:{email:emailA,passwordHash,role:"realtor"}});
    const b=await prisma.user.create({data:{email:emailB,passwordHash,role:"realtor"}});
    userIds.push(a.id,b.id);
    const p=await prisma.property.create({data:{
      title:"Integration only test listing",address:"25 Test Street",city:"Toronto",province:"ON",
      postalCode:"M4C 1B5",listingType:"sale",price:550000,bedrooms:2,bathrooms:1,
      propertyType:"Condo",description:"Test-only fictional property.",
      realtorName:"Test Agent",ownerId:a.id,
    }});
    propertyIds.push(p.id);
    const date=new Date(Date.now()+2*86400000).toISOString().slice(0,10);
    const payload={ name:"Test Buyer",email:"buyer@example.test",phone:"4165550132",preferredDate:date };
    assert.equal((await request("POST",`/properties/${p.id}/viewing-requests`,payload)).status,404);
    await prisma.property.update({where:{id:p.id},data:{status:"approved"}});
    assert.equal((await request("POST",`/properties/${p.id}/viewing-requests`,{...payload,name:"A"})).status,400);
    assert.equal((await request("POST",`/properties/${p.id}/viewing-requests`,payload)).status,201);
    assert.equal((await request("POST",`/properties/${p.id}/metrics`,{event:"view"})).status,202);
    const aLogin=await request("POST","/auth/login",{email:emailA,password:pass});
    const bLogin=await request("POST","/auth/login",{email:emailB,password:pass});
    assert.equal(aLogin.status,200);assert.equal(bLogin.status,200);
    const tokenA=aLogin.body.data.accessToken,tokenB=bLogin.body.data.accessToken;
    const own=await request("GET","/viewing-requests",undefined,tokenA);
    assert.equal(own.body.data.length,1);
    assert.equal((await request("GET","/viewing-requests",undefined,tokenB)).body.data.length,0);
    const leadId=own.body.data[0].id;
    assert.equal((await request("PATCH",`/viewing-requests/${leadId}`,{status:"contacted"},tokenB)).status,404);
    assert.equal((await request("PATCH",`/viewing-requests/${leadId}`,{status:"contacted"},tokenA)).status,200);
    assert.equal((await request("GET","/listing-insights",undefined,tokenB)).body.data.length,0);
    assert.equal((await request("GET","/listing-insights",undefined,tokenA)).body.data[0].views,1);
  } finally {
    try {
      await prisma.property.deleteMany({where:{id:{in:propertyIds}}});
      await prisma.user.deleteMany({where:{id:{in:userIds}}});
    } finally {
      await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
      await prisma.$disconnect();
    }
  }
});
