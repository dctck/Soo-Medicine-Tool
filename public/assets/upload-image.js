const MAX_UPLOAD=4_000_000;
export async function prepareUpload(file){
 const photo=['image/jpeg','image/png','image/webp'].includes(file.type);
 if(!photo){if(file.size>MAX_UPLOAD)throw Error('GIF·영상은 최대 4MB입니다. 사진은 JPEG·PNG·WebP로 선택해 주세요.');return file;}
 if(file.size>50_000_000)throw Error('사진은 최대 50MB까지 선택해 주세요.');
 // Keep animated WebP intact rather than silently removing its frames.
 if(file.type==='image/webp'){const head=new Uint8Array(await file.slice(0,4096).arrayBuffer());const marker=String.fromCharCode(...head);if(marker.includes('ANIM')){if(file.size>MAX_UPLOAD)throw Error('움직이는 WebP는 최대 4MB입니다.');return file;}}
 let bitmap;try{bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});}catch{throw Error('사진을 읽지 못했습니다. JPEG·PNG·WebP 파일을 확인해 주세요.');}
 try{
 if(bitmap.width*bitmap.height>60_000_000)throw Error('사진 해상도가 너무 큽니다. 6천만 화소 이하로 줄여 주세요.');
 if(file.size<=1_000_000&&bitmap.width<=2400&&bitmap.height<=2400)return file;
 const scale=Math.min(1,2400/bitmap.width,2400/bitmap.height),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const context=canvas.getContext('2d');if(!context)throw Error('이 브라우저에서 이미지 변환을 지원하지 않습니다.');context.drawImage(bitmap,0,0,canvas.width,canvas.height);
 let result;for(const quality of [.88,.8,.7]){result=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));if(result&&result.size<=MAX_UPLOAD)break;}
 if(!result||result.size>MAX_UPLOAD)throw Error('압축 후에도 파일이 큽니다. 사진 크기를 줄여 다시 선택해 주세요.');
 return file.size<=MAX_UPLOAD&&file.size<result.size?file:result;
 }finally{bitmap.close();}
}
