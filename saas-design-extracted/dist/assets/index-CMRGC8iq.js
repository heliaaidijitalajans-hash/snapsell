const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/HomePage-C1ft4F3S.js","assets/vendor-Bh53Ac8E.js","assets/firebase-D7C_4SXH.js","assets/PricingPage-BxQZIaLp.js","assets/ExamplesPage-DYcF8Rte.js","assets/SupportPage-CwtZPDak.js","assets/FAQPage-CnZnrtJY.js","assets/AboutPage-OJMMtB8E.js","assets/TermsPage-BfOBv-oq.js","assets/DistanceSalesPage-CiM2sjD1.js","assets/PreliminaryInfoPage-BELT_KIQ.js","assets/RefundPolicyPage-Co8PYeSN.js","assets/PrivacyPage-BeX0ocRH.js","assets/CookiePolicyPage-BKuoMgjK.js","assets/KvkkPage-UcJelNJ4.js","assets/EditorReplicatePage-DOJzZxPV.js","assets/LibraryPage-D2HazZ9e.js","assets/AccountPage-CMl7FXn1.js","assets/AdminPage-DiEmVsVG.js"])))=>i.map(i=>d[i]);
var O=Object.defineProperty;var R=(a,r,o)=>r in a?O(a,r,{enumerable:!0,configurable:!0,writable:!0,value:o}):a[r]=o;var A=(a,r,o)=>R(a,typeof r!="symbol"?r+"":r,o);import{u as _,v as n,w as e,G as H,x as M,y as B,z as m,U as P,X as V,M as q,O as G,A as Y,N as U,B as W,R as $}from"./vendor-Bh53Ac8E.js";import{g as Z,o as Q}from"./firebase-D7C_4SXH.js";(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))u(i);new MutationObserver(i=>{for(const l of i)if(l.type==="childList")for(const s of l.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&u(s)}).observe(document,{childList:!0,subtree:!0});function o(i){const l={};return i.integrity&&(l.integrity=i.integrity),i.referrerPolicy&&(l.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?l.credentials="include":i.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function u(i){if(i.ep)return;i.ep=!0;const l=o(i);fetch(i.href,l)}})();const J="modulepreload",X=function(a){return"/dashboard/"+a},j={},p=function(r,o,u){let i=Promise.resolve();if(o&&o.length>0){let s=function(t){return Promise.all(t.map(y=>Promise.resolve(y).then(h=>({status:"fulfilled",value:h}),h=>({status:"rejected",reason:h}))))};document.getElementsByTagName("link");const c=document.querySelector("meta[property=csp-nonce]"),g=(c==null?void 0:c.nonce)||(c==null?void 0:c.getAttribute("nonce"));i=s(o.map(t=>{if(t=X(t),t in j)return;j[t]=!0;const y=t.endsWith(".css"),h=y?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${t}"]${h}`))return;const d=document.createElement("link");if(d.rel=y?"stylesheet":J,y||(d.as="script"),d.crossOrigin="",d.href=t,g&&d.setAttribute("nonce",g),document.head.appendChild(d),y)return new Promise((f,b)=>{d.addEventListener("load",f),d.addEventListener("error",()=>b(new Error(`Unable to preload CSS for ${t}`)))})}))}function l(s){const c=new Event("vite:preloadError",{cancelable:!0});if(c.payload=s,window.dispatchEvent(c),!c.defaultPrevented)throw s}return i.then(s=>{for(const c of s||[])c.status==="rejected"&&l(c.reason);return r().catch(l)})},ee={apiKey:"AIzaSyDX3-UZN9pSTgMopELRd4dWq8_VA6Pi8Gw",authDomain:"snapsellapp-6649a.firebaseapp.com",projectId:"snapsellapp-6649a",storageBucket:"snapsellapp-6649a.firebasestorage.app",messagingSenderId:"503663017163",appId:"1:503663017163:web:8d02525549bd7f58f0af4e"};let x,w;function z(){return x||(x=_(ee),w=Z(x)),w}const ae=typeof window<"u"?window.location.origin:"",F=n.createContext(null),v="snapsell_session";async function E(){let a=localStorage.getItem(v);if(a)return a;try{const o=await(await fetch(ae+"/api/register",{method:"POST"})).json().catch(()=>({}));if(o&&o.sessionId)return localStorage.setItem(v,o.sessionId),o.sessionId}catch{}return""}function ie({children:a}){const[r,o]=n.useState(null),[u,i]=n.useState(()=>typeof window<"u"?localStorage.getItem(v):null),[l,s]=n.useState(!0),c=n.useCallback(async()=>{const h=z().currentUser;if(h)return{Authorization:"Bearer "+await h.getIdToken()};let d=u||localStorage.getItem(v);return d||(d=await E()),d?(i(d),{"X-Session-Id":d}):{}},[u]),g=n.useCallback(async()=>{await z().signOut(),localStorage.removeItem(v),i(null),o(null),window.location.href="/login"},[]);n.useEffect(()=>{const y=z(),h=Q(y,async d=>{if(o(d||null),d)i(null);else{const f=await E();i(f||null)}s(!1)});return()=>h()},[]);const t={user:r,sessionId:u,loading:l,getAuthHeaders:c,logout:g};return e.jsx(F.Provider,{value:t,children:a})}function ne(){const a=n.useContext(F);if(!a)throw new Error("useAuth must be used within AuthProvider");return a}const te={tr:{"nav.home":"Ana Sayfa","nav.imageEdit":"Görsel düzenleme","nav.examples":"Örnekler","nav.pricing":"Fiyatlandırma","nav.support":"Destek","nav.faq":"SSS","nav.about":"Hakkımızda","nav.login":"Giriş","nav.register":"Kayıt","nav.myAccount":"Hesabım","nav.library":"Kütüphane","nav.accountSettings":"Hesap Ayarları","nav.language":"Dil","footer.description":"E-ticaret satıcıları için profesyonel ürün görseli düzenleme, fiyat analizi ve SEO optimizasyonu platformu.","footer.product":"Ürün","footer.contact":"İletişim","footer.email":"E-posta","footer.whatsappTitle":"WhatsApp canlı DESTEK","footer.whatsappHint":"Sadece WhatsApp Üzerinden Ulaşın.","footer.legal":"Yasal","footer.terms":"KULLANIM ŞARTLARI","footer.privacy":"GİZLİLİK POLİTİKASI - PRIVACY POLICY","footer.copyright":"© 2026 SnapSell. Tüm hakları saklıdır.","home.heroTitle":"Ürün görsellerinizi","home.heroTitleHighlight":"profesyonelce","home.heroTitleSuffix":"düzenleyin","home.heroSubtitle":"E-ticaret satıcıları için ürün fotoğrafı düzenleme, arka plan kaldırma, SEO ve fiyat analizi tek platformda.","home.ctaStartFree":"Ücretsiz başlayın","home.ctaImageEdit":"Görsel düzenleme","home.ctaViewPricing":"Fiyatları inceleyin","home.testimonialsTitle":"Müşteri yorumları","home.testimonial1":"Ürün fotoğraflarımı dakikalar içinde düzenleyebiliyorum. Arka plan kaldırma ve stüdyo görünümü satışlarımı ciddi artırdı.","home.testimonial2":"SEO ve fiyat analizi tek yerden yapılıyor. Katalog yönetimi çok kolay, rakiplerime göre hep bir adım öndeyim.","home.testimonial3":"Fiyatı çok uygun, destek hızlı. Ürün görsellerimi toplu yükleyip hepsini aynı stilde çıkarmak artık çok kolay.","home.role1":"E-ticaret satıcısı","home.role2":"Marka yöneticisi","home.role3":"Dropshipping","home.statsUsers":"mutlu kullanıcı","home.statsConversions":"başarılı dönüşüm","home.whyTitle":"Neden SnapSell?","home.feature1Title":"Arka plan kaldırma","home.feature1Desc":"Ürün fotoğraflarınızdan arka planı otomatik kaldırın.","home.feature2Title":"Görsel düzenleme","home.feature2Desc":"Boyutlandırma, kırpma ve filtreler.","home.feature3Title":"SEO ve kütüphane","home.feature3Desc":"Dosya adları ve alt metinleri optimize edin.","home.feature4Title":"Fiyat analizi","home.feature4Desc":"Rekabetçi fiyat önerileri ve pazar analizi.","home.upcomingFeaturesTitle":"Gelecek Özellikler","home.upcomingFeaturesText":"Metinden reklam videosu ve görselden reklam videosu oluşturma.","examples.title":"Örnekler","examples.alt1":"Ürün görseli örneği – parfüm","examples.alt2":"Ürün görseli örneği – oje","examples.alt3":"Ürün görseli örneği – mutfak eşyası","examples.alt4":"Ürün görseli örneği – kedi maması","examples.alt5":"Ürün görseli örneği – tırnak ojesi","examples.alt6":"Ürün görseli örneği – parfüm (dış mekan)","examples.alt7":"Ürün görseli örneği – peluş oyuncak","examples.subtitle":"SnapSell ile neler yapabileceğinizi keşfedin. Görsel düzenleme aracını deneyin veya fiyatlandırmaya göz atın.","examples.ctaTry":"Görsel düzenlemeyi dene","examples.ctaPricing":"Fiyatlandırmaya git","pricing.title":"Fiyatlandırma","pricing.subtitle":"İhtiyacınıza uygun planı seçin. Tüm planlarda Görsel düzenleme, SEO açıklama ve fiyat analizi dahildir.","pricing.autoRenew":"Abonelikler otomatik olarak yenilenmektedir.","pricing.perPeriod":"/","pricing.custom":"Özel","pricing.enterpriseCta":"Kurumsal ihtiyaçlarınız mı var?","pricing.contactUs":"Bizimle iletişime geçin","pricing.comingSoon":`Snapsell abonelikleri çok yakında kullanıma sunulacak.

Sabrınız için teşekkür ederiz.`,"pricing.modalClose":"Tamam","support.title":"Destek","support.subtitle":"Sorularınız ve sorunlarınız için bize ulaşın.","support.email":"E-posta","support.emailDesc":"Destek için e-posta yazın.","support.emailWrite":"E-posta yaz","support.faq":"SSS","support.faqLink":"SSS sayfasına git","faq.title":"Sıkça Sorulan Sorular","faq.subtitle":"En çok merak edilen konuların cevapları.","faq.q1":"SnapSell nedir?","faq.a1":"SnapSell, e-ticaret satıcıları için ürün görseli düzenleme, SEO ve fiyat analizi sunan bir platformdur.","faq.q2":"Ücretsiz plan limitleri?","faq.a2":"Ücretsiz 3 deneme hakkı sunulmaktadır.","faq.q3":"İptal nasıl yapılır?","faq.a3":"Hesap ayarlarından aboneliğinizi iptal edebilirsiniz.","about.title":"Hakkımızda","about.p1":"SnapSell, e-ticaret satıcılarının ürün görsellerini hızlı ve profesyonel şekilde düzenlemesi, arka plan kaldırma, SEO iyileştirmesi ve fiyat analizi yapması için geliştirilmiş bir platformdur.","about.p2":"Amacımız, küçük ve orta ölçekli satıcıların büyük markalarla aynı görsel kaliteye ulaşabilmesini sağlamak. Yapay zeka destekli araçlarımızla tek tıkla arka plan kaldırma, fiyat analizi, otomatik dosya adı önerileri ve görsel kütüphane yönetimi sunuyoruz.","about.missionTitle":"Misyonumuz","about.mission":"Her satıcının, teknik bilgisi veya bütçesi ne olursa olsun, satışlarını güçlendirecek görsellere sahip olmasını sağlamak.","about.contactTitle":"İletişim","about.contact":"Öneri ve geri bildirimleriniz için","about.contactLink":"Destek","about.contactSuffix":"sayfamızdan bize ulaşabilirsiniz.","terms.title":"KULLANIM ŞARTLARI (TERMS OF SERVICE)","terms.updated":"Son güncelleme: 2026","terms.s1Title":"1. Taraflar ve Kabul","terms.s1":`Bu Kullanım Şartları ("Şartlar"), ("Aysel Nur Akıncı 1160825918") ile Snapsell platformuna erişen kullanıcı ("Kullanıcı") arasında akdedilmiştir.

Platforma erişim, hesap oluşturma veya ödeme yapılması halinde işbu Şartlar kabul edilmiş sayılır.`,"terms.s2Title":"2. Hizmet Tanımı","terms.s2":`Snapsell, internet üzerinden sunulan bulut tabanlı bir yazılım hizmetidir (SaaS).

Platform;
• Yapay zeka destekli görsel üretimi
• Prompt tabanlı sahne oluşturma
• Dijital içerik üretimi
• Abonelik planına bağlı kullanım limitleri
sunmaktadır.

Hizmet fiziksel ürün içermez.`,"terms.s3Title":"3. Hesap Oluşturma ve Güvenlik","terms.s3":`• Kullanıcı doğru ve güncel bilgi vermekle yükümlüdür.
• Hesap güvenliği kullanıcı sorumluluğundadır.
• Hesap paylaşımı yasaktır.
• Birden fazla kişinin tek hesap kullanması yasaktır.
• Şüpheli kullanım halinde hesap askıya alınabilir.`,"terms.s4Title":"4. Abonelik ve Ödeme Koşulları","terms.s4":`• Hizmet ücretlidir.
• Fiyatlar Amerikan Doları (USD) cinsindendir.
• Abonelikler otomatik yenilemelidir.
• Kullanıcı iptal etmediği sürece dönem sonunda ücret tahsil edilir.
• Vergi, banka komisyonu ve döviz farklarından kullanıcı sorumludur.
• Hizmet Sağlayıcı fiyat değişikliği yapma hakkını saklı tutar.`,"terms.s5Title":"5. İade ve Chargeback Politikası","terms.s5":`• Dijital hizmet aktif edildikten sonra iade yapılmaz.
• Kullanıcı, hizmetin anında ifasına başlandığını kabul eder.
• Haksız ödeme itirazı (chargeback) halinde hesap kalıcı olarak kapatılabilir.
• Fraud (sahtecilik) tespiti halinde hizmet sonlandırılır.`,"terms.s6Title":"6. Kullanım Kısıtlamaları","terms.s6":`Kullanıcı aşağıdaki fiilleri gerçekleştiremez:
• Hukuka aykırı içerik üretmek
• Telif hakkı ihlali yapmak
• Nefret, şiddet veya yasa dışı içerik üretmek
• Spam, bot, otomasyon suistimali yapmak
• Sistem açığı istismarı
• API limitlerini aşmaya yönelik manipülasyon

İhlal halinde hesap askıya alınabilir veya kapatılabilir.`,"terms.s7Title":"7. Yapay Zeka Çıktıları ve Sorumluluk","terms.s7":`• Platform tarafından üretilen içeriklerin doğruluğu garanti edilmez.
• AI çıktılarının kullanımından doğan hukuki sorumluluk kullanıcıya aittir.
• Üretilen içeriklerin üçüncü taraf haklarını ihlal etmeyeceği garanti edilmez.
• Kullanıcı, içerikleri kullanmadan önce hukuka uygunluğunu kontrol etmekle yükümlüdür.`,"terms.s8Title":"8. Hizmet Sürekliliği","terms.s8":`• Hizmet kesintisiz veya hatasız olacağı garanti edilmez.
• Bakım, güncelleme veya teknik arıza nedeniyle geçici kesinti olabilir.
• Bu durum iade sebebi oluşturmaz.`,"terms.s9Title":"9. Fikri Mülkiyet","terms.s9":`Platform yazılımı, tasarımı, algoritmaları ve markası Hizmet Sağlayıcı'ya aittir.

Kullanıcıya yalnızca sınırlı, devredilemez kullanım hakkı tanınır.`,"terms.s10Title":"10. Sorumluluğun Sınırlandırılması","terms.s10":`Hizmet Sağlayıcının toplam sorumluluğu, kullanıcının ilgili abonelik döneminde ödediği ücret ile sınırlıdır.

Dolaylı zararlar, kar kaybı, veri kaybı veya iş kesintisinden sorumluluk kabul edilmez.`,"terms.s11Title":"11. Hesap Askıya Alma ve Fesih","terms.s11":`Hizmet Sağlayıcı aşağıdaki durumlarda hesabı askıya alabilir veya sonlandırabilir:
• Şartların ihlali
• Fraud şüphesi
• Chargeback
• Hukuka aykırı kullanım
• Sistem güvenliğini tehlikeye atma`,"terms.s12Title":"12. Uluslararası Kullanım","terms.s12":`Platform global olarak kullanılabilir.

Kullanıcı, bulunduğu ülke mevzuatına uymakla yükümlüdür.`,"terms.s13Title":"13. Değişiklik Hakkı","terms.s13":`Hizmet Sağlayıcı işbu Şartları değiştirme hakkını saklı tutar.

Güncellenmiş metin platformda yayınlandığı tarihte yürürlüğe girer.`,"terms.s14Title":"14. Uygulanacak Hukuk","terms.s14":`İşbu Şartlar Türkiye Cumhuriyeti hukukuna tabidir.

Uyuşmazlıklarda İstanbul Mahkemeleri yetkilidir.`,"terms.contact":"Sorularınız için","terms.contactLink":"Destek","terms.contactSuffix":"sayfamızdan bize ulaşabilirsiniz.","footer.distanceSales":"MESAFELİ SATIŞ SÖZLEŞMESİ - DISTANCE SALES AGREEMENT","footer.preliminaryInfo":"ÖN BİLGİLENDİRME FORMU - PRELIMINARY INFORMATION FORM","footer.refundPolicy":"İPTAL & İADE POLİTİKASI - REFUND & CANCELLATION POLICY","footer.cookiePolicy":"ÇEREZ POLİTİKASI - COOKIE POLICY","footer.kvkk":"KVKK AYDINLATMA METNİ","distance.title":"MESAFELİ SATIŞ SÖZLEŞMESİ (Dijital Hizmet – SaaS Abonelik Modeli)","distance.updated":"Son güncelleme: 2026","distance.s1Title":"1. Taraflar","distance.s1":`İşbu Mesafeli Satış Sözleşmesi ("Sözleşme");

Hizmet Sağlayıcı: Aysel Nur Akıncı
Vergi No: 1160825918
Adres: Istanbul/Silivri Mimar Sinan Mah. Fatih Sultan Mehmet Cad. No:38-R Daire:14
E-posta: Snapsell.destek@gmail.com

ile

Snapsell platformuna üye olan gerçek veya tüzel kişi ("Kullanıcı") arasında elektronik ortamda kurulmuştur.

Kullanıcı, platform üzerinden ödeme yaparak işbu sözleşmeyi kabul etmiş sayılır.`,"distance.s2Title":"2. Sözleşmenin Konusu","distance.s2":`İşbu sözleşmenin konusu, Hizmet Sağlayıcı tarafından sunulan Snapsell bulut tabanlı yazılım platformuna (SaaS) abonelik erişiminin sağlanmasına ilişkin tarafların hak ve yükümlülüklerinin belirlenmesidir.

Sunulan hizmet fiziksel ürün değil, tamamen dijital ortamda sağlanan yazılım erişim hizmetidir.`,"distance.s3Title":"3. Hizmetin Niteliği","distance.s3":`Snapsell platformu;
• Yapay zeka destekli görsel üretimi
• Prompt tabanlı sahne oluşturma
• Dijital içerik üretim araçları
• Abonelik planına göre belirlenen kullanım limitleri
sunmaktadır.

Hizmet internet üzerinden anlık olarak sağlanır ve fiziksel teslimat içermez.`,"distance.s4Title":"4. Sözleşmenin Kurulması","distance.s4":`Sözleşme, kullanıcının ödeme işlemini tamamlaması ve elektronik onay vermesi ile kurulmuş sayılır.

Kullanıcı, sözleşme şartlarını okuyup anladığını kabul eder.`,"distance.s5Title":"5. Ücret ve Ödeme Koşulları","distance.s5":`• Hizmet bedelleri Amerikan Doları (USD) cinsindendir.
• Ödeme, platformda sunulan elektronik ödeme yöntemleri aracılığıyla tahsil edilir.
• Abonelikler otomatik yenilemelidir.
• Kullanıcı iptal etmediği sürece abonelik süresi sonunda ücret tahsil edilir.
• Banka komisyonları, vergi yükümlülükleri ve döviz farklarından kullanıcı sorumludur.
• Hizmet Sağlayıcı fiyat değişikliği yapma hakkını saklı tutar.`,"distance.s6Title":"6. Abonelik Süresi ve Yenileme","distance.s6":`• Abonelik aylık veya yıllık olabilir.
• Süre sonunda otomatik olarak yenilenir.
• Kullanıcı yenileme tarihinden önce hesabı üzerinden iptal edebilir.
• İptal işlemi mevcut fatura dönemi sonunda yürürlüğe girer.`,"distance.s7Title":"7. Cayma Hakkı ve İstisnası","distance.s7":`6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca;

• Elektronik ortamda anında ifasına başlanan dijital içerik ve yazılım hizmetlerinde cayma hakkı kullanılamaz.
• Kullanıcı, ödeme sonrası hizmetin derhal aktif edildiğini ve bu nedenle cayma hakkından feragat ettiğini kabul eder.`,"distance.s8Title":"8. İptal ve İade Koşulları","distance.s8":`• Hizmet aktif edildikten sonra ücret iadesi yapılmaz.
• Teknik arıza veya sistemsel hata durumunda, inceleme sonrası iade kararı verilebilir.
• Kullanıcının haksız ödeme itirazı (chargeback) başlatması halinde hesap askıya alınabilir veya kalıcı olarak kapatılabilir.
• Sahtecilik, kötüye kullanım veya sözleşme ihlali halinde hizmet sonlandırılabilir.`,"distance.s9Title":"9. Kullanıcının Yükümlülükleri","distance.s9":`Kullanıcı:
• Hesap bilgilerini doğru beyan etmekle,
• Hesap güvenliğini sağlamakla,
• Platformu hukuka uygun kullanmakla,
• Telif hakkı ve üçüncü kişi haklarını ihlal etmemekle
yükümlüdür.`,"distance.s10Title":"10. Sorumluluk Sınırı","distance.s10":`• Yapay zeka tarafından üretilen içeriklerin doğruluğu garanti edilmez.
• İçeriklerin kullanımından doğan hukuki sorumluluk kullanıcıya aittir.
• Hizmet Sağlayıcının toplam sorumluluğu, kullanıcının ilgili abonelik döneminde ödediği ücret ile sınırlıdır.
• Dolaylı zararlar, veri kaybı, kar kaybı veya iş kesintisinden sorumluluk kabul edilmez.`,"distance.s11Title":"11. Mücbir Sebep","distance.s11":"Doğal afet, savaş, teknik altyapı arızası, internet kesintisi gibi tarafların kontrolü dışındaki durumlarda sorumluluk doğmaz.","distance.s12Title":"12. Uyuşmazlıkların Çözümü","distance.s12":`İşbu sözleşme Türkiye Cumhuriyeti hukukuna tabidir.

Uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.`,"distance.contact":"Sorularınız için","distance.contactLink":"Destek","distance.contactSuffix":"sayfamızdan bize ulaşabilirsiniz.","preliminary.title":"ÖN BİLGİLENDİRME FORMU (Dijital Hizmet – SaaS Abonelik Modeli)","preliminary.updated":"Son güncelleme: 2026","preliminary.s1Title":"1. Hizmet Sağlayıcı Bilgileri","preliminary.s1":`Unvan: Aysel Nur Akıncı
Vergi No: 1160825918
Adres: Istanbul/Silivri Mimar Sinan Mah. Fatih Sultan Mehmet Cad. No:38-R Daire:14
E-posta: Snapsell.destek@gmail.com`,"preliminary.s2Title":"2. Hizmetin Temel Özellikleri","preliminary.s2":`Snapsell, internet üzerinden sunulan bulut tabanlı bir yazılım hizmetidir (SaaS).

Platform;
• Yapay zeka destekli görsel üretim
• Prompt tabanlı sahne oluşturma
• Dijital içerik üretim araçları
• Abonelik planına bağlı kullanım limitleri
sunmaktadır.

Hizmet fiziksel bir ürün değildir ve tamamen dijital ortamda sağlanır.`,"preliminary.s3Title":"3. Fiyatlandırma ve Ödeme","preliminary.s3":`• Hizmet bedelleri Amerikan Doları (USD) cinsindendir.
• Ödeme, platformda sunulan elektronik ödeme yöntemleri aracılığıyla tahsil edilir.
• Abonelikler otomatik yenilemelidir.
• Kullanıcı iptal etmediği sürece abonelik süresi sonunda ücret tahsil edilir.
• Banka komisyonları ve döviz kur farkları kullanıcıya aittir.`,"preliminary.s4Title":"4. Abonelik Süresi ve İptal","preliminary.s4":`• Abonelik aylık veya yıllık olabilir.
• Kullanıcı, yenileme tarihinden önce hesabı üzerinden iptal edebilir.
• İptal, mevcut fatura dönemi sonunda yürürlüğe girer.`,"preliminary.s5Title":"5. Cayma Hakkı Hakkında Bilgilendirme","preliminary.s5":`6502 sayılı Tüketicinin Korunması Hakkında Kanun ve ilgili yönetmelikler uyarınca;

• Elektronik ortamda anında ifasına başlanan dijital içerik ve yazılım hizmetlerinde cayma hakkı kullanılamaz.
• Kullanıcı, ödeme işlemi tamamlandığında hizmetin derhal aktif edileceğini ve bu nedenle cayma hakkının bulunmadığını kabul eder.`,"preliminary.s6Title":"6. İade Politikası","preliminary.s6":`• Hizmet aktif edildikten sonra ücret iadesi yapılmaz.
• Teknik arıza veya sistemsel hata durumunda, inceleme sonrası iade kararı verilebilir.
• Haksız ödeme itirazı (chargeback) durumunda hesap askıya alınabilir veya kapatılabilir.`,"preliminary.s7Title":"7. Kullanım Sorumluluğu","preliminary.s7":`• Yapay zeka tarafından üretilen içeriklerin kullanımından doğan hukuki sorumluluk kullanıcıya aittir.
• Hizmet kesintisiz veya hatasız olacağı garanti edilmez.`,"preliminary.s8Title":"8. Şikayet ve İletişim","preliminary.s8":`Her türlü soru ve talep için:
E-posta: Snapsell.destek@gmail.com`,"preliminary.contact":"Sorularınız için","preliminary.contactLink":"Destek","preliminary.contactSuffix":"sayfamızdan bize ulaşabilirsiniz.","refund.title":"İPTAL & İADE POLİTİKASI (Dijital Hizmet – SaaS Abonelik Modeli)","refund.updated":"Son güncelleme: 2026","refund.s1Title":"1. Genel Bilgilendirme","refund.s1":`Snapsell, internet üzerinden sunulan bulut tabanlı bir yazılım hizmetidir (SaaS).

Sunulan hizmet fiziksel bir ürün değildir ve dijital ortamda anında sağlanmaktadır.

Bu nedenle iade ve iptal koşulları fiziksel ürün satışlarından farklılık göstermektedir.`,"refund.s2Title":"2. Abonelik İptali","refund.s2":`• Kullanıcı, hesabı üzerinden aboneliğini dilediği zaman iptal edebilir.
• İptal işlemi mevcut fatura döneminin sonunda yürürlüğe girer.
• İptal sonrası otomatik yenileme durdurulur.
• Mevcut dönem için tahsil edilmiş ücret iade edilmez.`,"refund.s3Title":"3. Cayma Hakkı ve İade Şartları","refund.s3":`6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği uyarınca;

• Elektronik ortamda anında ifasına başlanan dijital içerik ve yazılım hizmetlerinde cayma hakkı kullanılamaz.
• Kullanıcı, ödeme işlemi tamamlandığında hizmetin derhal aktif edildiğini ve cayma hakkının bulunmadığını kabul eder.

Bu nedenle:
• Hizmet aktif edildikten sonra ücret iadesi yapılmaz.
• Kısmi kullanım durumunda iade yapılmaz.
• Kullanılmış abonelik süreleri için geri ödeme yapılmaz.`,"refund.s4Title":"4. İstisnai İade Durumları","refund.s4":`Aşağıdaki durumlarda inceleme sonrası iade kararı verilebilir:
• Hizmetin teknik olarak hiç sağlanamamış olması
• Sistemsel hata nedeniyle erişimin mümkün olmaması
• Mükerrer (çift) ödeme tespiti

İade talepleri, ödeme tarihinden itibaren 7 gün içinde yazılı olarak iletilmelidir.`,"refund.s5Title":"5. Ödeme İtirazı (Chargeback) ve Kötüye Kullanım","refund.s5":`• Kullanıcının haksız ödeme itirazı (chargeback) başlatması halinde hesap askıya alınabilir veya kalıcı olarak kapatılabilir.
• Sahtecilik (fraud), kötüye kullanım veya sözleşme ihlali tespit edilmesi halinde hizmet derhal sonlandırılabilir.
• Bu durumlarda ücret iadesi yapılmaz.`,"refund.s6Title":"6. Para İade Süreci","refund.s6":`İade kararı verilmesi halinde:
• İade, ödemenin yapıldığı yöntem üzerinden gerçekleştirilir.
• İade süresi, ilgili finans kuruluşunun işlem süresine bağlıdır.
• Banka komisyonları ve kur farkları iade kapsamına dahil değildir.`,"refund.s7Title":"7. İletişim","refund.s7":`İade ve iptal talepleri için:
E-posta: Snapsell.destek@gmail.com`,"refund.contact":"Sorularınız için","refund.contactLink":"Destek","refund.contactSuffix":"sayfamızdan bize ulaşabilirsiniz.","privacy.title":"GİZLİLİK POLİTİKASI","privacy.updated":"Son güncelleme: 2026","privacy.s1Title":"1. Veri Sorumlusu","privacy.s1":`Bu Gizlilik Politikası, Aysel Nur Akıncı tarafından işletilen Snapsell platformuna ilişkin kişisel verilerin işlenmesine dair esasları düzenler.

İletişim:
E-posta: Snapsell.destek@gmail.com
Adres: Istanbul/Silivri Mimar Sinan Mah. Fatih Sultan Mehmet Cad. No:38-R Daire:14`,"privacy.s2Title":"2. Toplanan Veriler","privacy.s2":`Platform kullanımı sırasında aşağıdaki veriler toplanabilir:

2.1 Kimlik ve İletişim Bilgileri
• Ad soyad
• E-posta adresi

2.2 Finansal Bilgiler
• Ödeme işlem bilgileri
(Not: Kart bilgileri ödeme kuruluşu tarafından işlenir, sistemimizde saklanmaz.)

2.3 Teknik Veriler
• IP adresi
• Cihaz bilgisi
• Tarayıcı bilgisi
• Log kayıtları
• Çerez verileri

2.4 Kullanım Verileri
• Platform içi işlem geçmişi
• AI üretim girdileri (prompt)
• Üretilen içerikler`,"privacy.s3Title":"3. Verilerin İşlenme Amaçları","privacy.s3":`Toplanan veriler aşağıdaki amaçlarla işlenir:
• Hizmetin sunulması ve sürdürülmesi
• Abonelik işlemlerinin yürütülmesi
• Ödeme işlemlerinin gerçekleştirilmesi
• Güvenlik ve fraud önleme
• Yasal yükümlülüklerin yerine getirilmesi
• Sistem performansının iyileştirilmesi`,"privacy.s4Title":"4. Hukuki Sebepler","privacy.s4":`Kişisel veriler aşağıdaki hukuki sebeplere dayanarak işlenir:
• Sözleşmenin ifası
• Meşru menfaat
• Açık rıza (gerektiğinde)
• Yasal yükümlülük`,"privacy.s5Title":"5. Verilerin Saklanma Süresi","privacy.s5":`Kişisel veriler;
• Abonelik süresi boyunca
• Yasal saklama yükümlülükleri süresince
• Olası uyuşmazlık süreçleri boyunca
saklanabilir.

Süre sonunda veriler silinir, yok edilir veya anonim hale getirilir.`,"privacy.s6Title":"6. Veri Aktarımı","privacy.s6":`Veriler aşağıdaki üçüncü taraflarla paylaşılabilir:
• Ödeme kuruluşları
• Hosting ve altyapı sağlayıcıları
• Bulut hizmet sağlayıcıları
• Yasal merciler (talep halinde)

Uluslararası kullanıcılar açısından veriler, Türkiye veya farklı ülkelerde bulunan sunucularda işlenebilir.`,"privacy.s7Title":"7. Yapay Zeka Verileri","privacy.s7":`Kullanıcı tarafından platforma girilen içerikler (prompt) ve üretilen çıktılar, hizmetin sağlanması amacıyla işlenir.

Bu veriler:
• Sistem performansını geliştirmek
• Güvenlik kontrolleri yapmak
• Teknik iyileştirmeler sağlamak
amacıyla anonim veya toplu şekilde analiz edilebilir.

Hizmet Sağlayıcı, kullanıcı içeriklerini üçüncü kişilere ticari amaçla satmaz.`,"privacy.s8Title":"8. Veri Güvenliği","privacy.s8":`Hizmet Sağlayıcı;
• Teknik güvenlik önlemleri
• Şifreleme yöntemleri
• Yetki sınırlamaları
• Güvenlik protokolleri
kullanarak kişisel verileri korumayı amaçlar.

Ancak internet üzerinden veri aktarımının tamamen güvenli olduğu garanti edilemez.`,"privacy.s9Title":"9. Kullanıcının Hakları (KVKK & GDPR Kapsamında)","privacy.s9":`Kullanıcı;
• Verilerine erişme
• Düzeltme talep etme
• Silinmesini isteme
• İşlemeye itiraz etme
• Veri taşınabilirliği talep etme
haklarına sahiptir.

Talepler yazılı olarak veya e-posta yoluyla iletilebilir.`,"privacy.s10Title":"10. Çerez Kullanımı","privacy.s10":`Platformda çerezler kullanılmaktadır.

Detaylı bilgi için Çerez Politikası incelenmelidir.`,"privacy.s11Title":"11. Politika Değişiklikleri","privacy.s11":`Bu Gizlilik Politikası güncellenebilir.

Güncel versiyon platformda yayınlandığı tarihte yürürlüğe girer.`,"privacy.contact":"Gizlilik ile ilgili sorularınız için","privacy.contactLink":"Destek","privacy.contactSuffix":"sayfamızdan bize ulaşabilirsiniz.","cookie.title":"ÇEREZ POLİTİKASI","cookie.updated":"Son güncelleme: 2026","cookie.s1Title":"1. Amaç","cookie.s1":`Bu Çerez Politikası, Snapsell platformu ("Platform") tarafından kullanılan çerezlere ilişkin olarak kullanıcıların bilgilendirilmesi amacıyla hazırlanmıştır.

Platform, kullanıcı deneyimini geliştirmek, hizmetleri güvenli şekilde sunmak ve performansı artırmak amacıyla çerezler kullanmaktadır.`,"cookie.s2Title":"2. Çerez Nedir?","cookie.s2":`Çerezler, ziyaret ettiğiniz internet siteleri tarafından tarayıcınız aracılığıyla cihazınıza kaydedilen küçük metin dosyalarıdır.

Bu dosyalar sayesinde site tercihleri hatırlanabilir ve kullanıcı deneyimi iyileştirilebilir.`,"cookie.s3Title":"3. Kullanılan Çerez Türleri","cookie.s3":`3.1 Zorunlu Çerezler
Bu çerezler platformun düzgün çalışması için gereklidir.
Örneğin:
• Oturum yönetimi
• Güvenlik doğrulama
• Abonelik kontrolü
Bu çerezler devre dışı bırakılamaz.

3.2 Performans ve Analitik Çerezler
Bu çerezler;
• Ziyaretçi sayısını analiz etmek
• Platform performansını ölçmek
• Hata tespiti yapmak
amacıyla kullanılır.
Bu çerezler anonim veriler üretir.

3.3 Fonksiyonel Çerezler
• Dil tercihi
• Kullanıcı ayarları
• Hesap tercihlerinin hatırlanması
amacıyla kullanılır.

3.4 Pazarlama ve Reklam Çerezleri (Varsa)
Platformda üçüncü taraf reklam hizmetleri kullanılması halinde, kullanıcı davranışlarına dayalı içerik sunmak amacıyla çerezler kullanılabilir.`,"cookie.s4Title":"4. Çerezlerin Hukuki Dayanağı","cookie.s4":`Çerezler;
• KVKK kapsamında meşru menfaat
• Sözleşmenin ifası
• Açık rıza (zorunlu olmayan çerezler için)
hukuki sebeplerine dayanarak işlenmektedir.

Zorunlu olmayan çerezler için kullanıcı onayı alınır.`,"cookie.s5Title":"5. Çerezlerin Saklanma Süresi","cookie.s5":`Çerezler;
• Oturum süresince (session cookies)
• Belirli süre boyunca (persistent cookies)
cihazda saklanabilir.

Saklama süresi çerez türüne göre değişiklik gösterir.`,"cookie.s6Title":"6. Çerezlerin Kontrolü","cookie.s6":`Kullanıcılar;
• Tarayıcı ayarlarından çerezleri silebilir
• Çerez kullanımını engelleyebilir
• Çerez tercihlerini değiştirebilir

Ancak bazı çerezlerin devre dışı bırakılması platformun düzgün çalışmasını engelleyebilir.`,"cookie.s7Title":"7. Üçüncü Taraf Çerezler","cookie.s7":`Platform;
• Analitik hizmet sağlayıcılar
• Ödeme altyapısı sağlayıcıları
• Bulut ve güvenlik hizmetleri
tarafından yerleştirilen çerezler kullanabilir.

Bu çerezler ilgili üçüncü tarafların gizlilik politikalarına tabidir.`,"cookie.s8Title":"8. Uluslararası Veri Aktarımı","cookie.s8":"Çerezler aracılığıyla toplanan veriler, Türkiye veya yurt dışında bulunan sunucularda işlenebilir.","cookie.s9Title":"9. Politika Güncellemeleri","cookie.s9":`Bu Çerez Politikası güncellenebilir.

Güncel versiyon platformda yayınlandığı tarihte yürürlüğe girer.`,"cookie.contact":"Sorularınız için","cookie.contactLink":"Destek","cookie.contactSuffix":"sayfamızdan bize ulaşabilirsiniz.","cookie.bannerTitle":"Çerez tercihleriniz","cookie.bannerText":"Sitemizde deneyiminizi iyileştirmek için çerezler kullanıyoruz. Zorunlu çerezler site çalışması için gereklidir. Analitik çerezler isteğe bağlıdır.","cookie.essentialCookies":"Zorunlu çerezler","cookie.essentialDesc":"Oturum, güvenlik ve temel işlevler için gerekli. Kapatılamaz.","cookie.analyticsCookies":"Analitik çerezler","cookie.analyticsDesc":"Ziyaret istatistikleri ve performans ölçümü. İsteğe bağlı.","cookie.acceptAll":"Tümünü kabul et","cookie.essentialOnly":"Sadece zorunlu","cookie.customize":"Özelleştir","cookie.savePreferences":"Tercihleri kaydet","cookie.policyLink":"Çerez politikası","kvkk.title":"KVKK AYDINLATMA METNİ (6698 Sayılı Kişisel Verilerin Korunması Kanunu Kapsamında)","kvkk.updated":"Son güncelleme: 2026","kvkk.s1Title":"1. Veri Sorumlusu","kvkk.s1":`6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca kişisel verileriniz;

Aysel Nur Akıncı
Vergi No: 1160825918
Adres: Istanbul/Silivri Mimar Sinan Mah. Fatih Sultan Mehmet Cad. No:38-R Daire:14
E-posta: Snapsell.destek@gmail.com

tarafından veri sorumlusu sıfatıyla işlenmektedir.`,"kvkk.s2Title":"2. İşlenen Kişisel Veriler","kvkk.s2":`Snapsell platformu kapsamında aşağıdaki kişisel veriler işlenebilmektedir:

Kimlik ve İletişim Bilgileri
• Ad soyad
• E-posta adresi

Finansal Bilgiler
• Ödeme işlem bilgileri
(Not: Kart bilgileriniz ödeme kuruluşu tarafından işlenmekte olup sistemlerimizde saklanmamaktadır.)

İşlem Güvenliği Bilgileri
• IP adresi
• Cihaz ve tarayıcı bilgileri
• Log kayıtları

Kullanım Verileri
• Platform kullanım geçmişi
• AI üretim girdileri (prompt)
• Üretilen dijital içerikler`,"kvkk.s3Title":"3. Kişisel Verilerin İşlenme Amaçları","kvkk.s3":`Kişisel verileriniz;
• Hizmetin sunulması ve sözleşmenin ifası
• Abonelik ve ödeme işlemlerinin yürütülmesi
• Sistem güvenliğinin sağlanması
• Kötüye kullanım ve fraud önleme
• Yasal yükümlülüklerin yerine getirilmesi
• Hizmet kalitesinin artırılması
amaçlarıyla işlenmektedir.`,"kvkk.s4Title":"4. Kişisel Verilerin Aktarımı","kvkk.s4":`Kişisel verileriniz;
• Ödeme kuruluşlarına
• Hosting ve altyapı sağlayıcılarına
• Bulut hizmet sağlayıcılarına
• Hukuken yetkili kamu kurum ve kuruluşlarına
KVKK'nın 8. ve 9. maddelerine uygun olarak aktarılabilir.

Uluslararası kullanıcılar bakımından veriler, yurt dışında bulunan sunucularda işlenebilir.`,"kvkk.s5Title":"5. Kişisel Verilerin Toplanma Yöntemi ve Hukuki Sebebi","kvkk.s5":`Kişisel veriler;
• Web sitesi ve mobil arayüz üzerinden elektronik ortamda
• Üyelik ve ödeme işlemleri sırasında
• Çerezler ve log kayıtları aracılığıyla
toplanmaktadır.

Veriler;
• Sözleşmenin kurulması ve ifası
• Veri sorumlusunun meşru menfaati
• Yasal yükümlülüklerin yerine getirilmesi
• Açık rıza (gerektiğinde)
hukuki sebeplerine dayanılarak işlenmektedir.`,"kvkk.s6Title":"6. İlgili Kişinin Hakları","kvkk.s6":`KVKK'nın 11. maddesi uyarınca ilgili kişi olarak;
• Kişisel verilerinizin işlenip işlenmediğini öğrenme
• İşlenmişse buna ilişkin bilgi talep etme
• İşlenme amacını öğrenme ve amacına uygun kullanılıp kullanılmadığını öğrenme
• Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri öğrenme
• Eksik veya yanlış işlenmiş olması hâlinde düzeltilmesini isteme
• KVKK'da öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme
• İşlemeye itiraz etme
• Kanun kapsamında yasal başvuru haklarını kullanma
haklarına sahipsiniz.`,"kvkk.s7Title":"7. Başvuru Yöntemi","kvkk.s7":`KVKK kapsamındaki taleplerinizi;
E-posta: Snapsell.destek@gmail.com
adresine yazılı olarak iletebilirsiniz.

Başvurular mevzuatta öngörülen süre içerisinde sonuçlandırılacaktır.`,"kvkk.contact":"Sorularınız için","kvkk.contactLink":"Destek","kvkk.contactSuffix":"sayfamızdan bize ulaşabilirsiniz.","account.title":"Hesap Ayarları","account.subtitle":"Profiliniz, plan ve kullanım bilgileriniz.","account.profile":"Profil","account.name":"Ad","account.membership":"Üyelik","account.usageSummary":"Kullanım özeti","account.remainingConversions":"Kalan dönüşüm hakkı","account.conversionNote":"1 dönüşüm = 1 ürün görseli işlemi","account.totalConversions":"Toplam yapılan dönüşüm","account.sinceAccount":"Hesap açılışından bu yana","account.planDetail":"Plan detayı","account.imageEdit":"Görsel düzenleme","account.subscription":"Abonelik","account.renewUpgrade":"Planı yenile / yükselt","account.renewDesc":"Fiyatlandırma sayfasından planınızı yenileyebilir veya değiştirebilirsiniz.","account.goPricing":"Fiyatlandırmaya git","account.cancelTitle":"Aboneliği iptal etmek","account.cancelDesc":"İptal veya plan değişikliği için destek ekibi ile iletişime geçin.","account.cancel":"İptal","account.renewingSubscription":"Yenilenen abonelik","account.renewingSubscriptionDesc":"İptal edilmediği takdirde otomatik olarak yenilenir. Yenilemeden önce istediğiniz zaman iptal edebilirsiniz.","account.session":"Oturum","account.logoutDesc":"Hesabınızdan güvenli çıkış yapın.","account.logout":"Çıkış yap","account.errorLoad":"Hesap bilgisi alınamadı","account.errorGeneric":"Bir hata oluştu","account.pleaseLogin":"Giriş yaptığınızdan emin olun.","account.loadFailed":"Hesap bilgisi yüklenemedi.","library.title":"Kütüphane","library.empty":"Henüz yükleme yok. Editörden bir fotoğraf yükleyin.","library.note":"Not:","library.noteText":"Kütüphane tarayıcınızda (localStorage) saklanır. En son 20 dönüşüm gösterilir; daha eski kayıtlar otomatik olarak listeden çıkar. Veriler yalnızca bu cihazda kalır; farklı cihaz veya tarayıcıda görünmez.","editor.title":"Ürün stüdyo görseli","editor.pleaseSelectImage":"Lütfen bir görsel seçin (PNG, JPG, WEBP).","editor.dragOrClick":"Görseli buraya sürükleyin veya tıklayın","editor.formats":"PNG, JPG veya WEBP","editor.uploadedImage":"Yüklenen görsel","editor.uploadedAlt":"Yüklenen","editor.selectDifferent":"Farklı görsel seç","editor.whereList":"Ürünü hangi mağazada listeleyeceksiniz?","editor.multiStore":"Birden fazla mağaza seçebilirsiniz.","editor.photoQuality":"Fotoğraf kalitesi","editor.selectStyle":"Görsel stilini seçin.","editor.qualityStudio":"Stüdyo","editor.qualityPro":"Profesyonel","editor.qualityLuxury":"Lüks","editor.conversionText":"Dönüşüm metni","editor.conversionHint":"Arka plan açıklaması (isteğe bağlı).","editor.promptPlaceholder":"Örn: profesyonel stüdyo, nötr arka plan, yumuşak ışık","editor.priceAnalysisTitle":"Fiyat analizi için ürünü tanıtın","editor.priceAnalysisHint":"Bu metin fiyat analizi sisteminde kullanılır; ürün adı, kategori veya kısa açıklama yazabilirsiniz.","editor.pricePlaceholder":"Örn: Kadın deri ceket, siyah, M beden","editor.processing":"İşleniyor… (1–2 dk sürebilir)","editor.convert":"Dönüştür","editor.original":"Orijinal (yüklediğiniz)","editor.originalHint":"Beğenirseniz bu görseli kullanabilirsiniz.","editor.result":"Sonuç (stüdyo görseli)","editor.resultHint":"Arka plan değişmiş hâli. Beğenmezseniz yukarıdaki orijinali kullanın.","editor.resultAlt":"Düzenleme sonucu","editor.openInNewTab":"Sonucu yeni sekmede aç","editor.downloadOrOpen":"Sonucu yeni sekmede aç / indir →","editor.priceAnalysis":"Fiyat analizi","editor.priceSource":"Kaynak","editor.priceMin":"Min","editor.priceAvg":"Ort.","editor.priceMax":"Maks","editor.priceDisclaimer":"Bu fiyatlar ortalama analiz fiyatlarıdır, satış önerisi değildir.","editor.failed":"İşlem başarısız","editor.timeout":"İstek zaman aşımına uğradı. Sunucu veya PhotoRoom yanıt vermedi; tekrar deneyin.","editor.renewPhotoRoom":"PhotoRoom planını yenile →","editor.paymentBalance":"Ödeme / bakiye →","editor.proPlanRequired":"Pro plan (Görsel Düzenleme) gerekli","editor.proPlanDesc":"Bu sayfa PhotoRoom ile hem arka planı siler hem de yeni arka plan oluşturur. Kullanmak için Görsel Düzenleme (Pro) planının ücretini ödemeniz gerekir.","editor.goPricing":"Fiyatlandırmaya git","editor.imageLoadFailed":"Görsel doğrudan yüklenemedi."},en:{"nav.home":"Home","nav.imageEdit":"Image editing","nav.examples":"Examples","nav.pricing":"Pricing","nav.support":"Support","nav.faq":"FAQ","nav.about":"About","nav.login":"Login","nav.register":"Sign up","nav.myAccount":"My account","nav.library":"Library","nav.accountSettings":"Account settings","nav.language":"Language","footer.description":"Professional product image editing, price analysis and SEO optimization platform for e-commerce sellers.","footer.product":"Product","footer.contact":"Contact","footer.email":"Email","footer.whatsappTitle":"WhatsApp live support","footer.whatsappHint":"Contact us only via WhatsApp.","footer.legal":"Legal","footer.terms":"TERMS OF SERVICE","footer.privacy":"PRIVACY POLICY","footer.copyright":"© 2026 SnapSell. All rights reserved.","home.heroTitle":"Edit your product images","home.heroTitleHighlight":"professionally","home.heroTitleSuffix":"","home.heroSubtitle":"Product photo editing, background removal, SEO and price analysis for e-commerce sellers — all in one platform.","home.ctaStartFree":"Start for free","home.ctaImageEdit":"Image editing","home.ctaViewPricing":"View pricing","home.testimonialsTitle":"Customer reviews","home.testimonial1":"I can edit my product photos in minutes. Background removal and studio look seriously increased my sales.","home.testimonial2":"SEO and price analysis in one place. Catalog management is so easy, I'm always one step ahead of my competitors.","home.testimonial3":"Great price, fast support. Bulk uploading and styling all my product images is now very easy.","home.role1":"E-commerce seller","home.role2":"Brand manager","home.role3":"Dropshipping","home.statsUsers":"happy users","home.statsConversions":"successful conversions","home.whyTitle":"Why SnapSell?","home.feature1Title":"Background removal","home.feature1Desc":"Automatically remove background from your product photos.","home.feature2Title":"Image editing","home.feature2Desc":"Resize, crop and filters.","home.feature3Title":"SEO & library","home.feature3Desc":"Optimize file names and alt text.","home.feature4Title":"Price analysis","home.feature4Desc":"Competitive pricing suggestions and market analysis.","home.upcomingFeaturesTitle":"Coming features","home.upcomingFeaturesText":"Create ad videos from text and ad videos from images.","examples.title":"Examples","examples.alt1":"Product image example – fragrance","examples.alt2":"Product image example – nail polish","examples.alt3":"Product image example – kitchenware","examples.alt4":"Product image example – cat food","examples.alt5":"Product image example – nail polish","examples.alt6":"Product image example – fragrance (outdoor)","examples.alt7":"Product image example – plush toy","examples.subtitle":"Discover what you can do with SnapSell. Try the image editing tool or check out pricing.","examples.ctaTry":"Try image editing","examples.ctaPricing":"View pricing","pricing.title":"Pricing","pricing.subtitle":"Choose the plan that fits your needs. All plans include Image editing, SEO description and price analysis.","pricing.autoRenew":"Subscriptions are automatically renewed.","pricing.perPeriod":"/","pricing.custom":"Custom","pricing.enterpriseCta":"Enterprise needs?","pricing.contactUs":"Contact us","pricing.comingSoon":`Snapsell subscriptions will be available very soon.

Thank you for your patience.`,"pricing.modalClose":"OK","support.title":"Support","support.subtitle":"Reach out for questions and issues.","support.email":"Email","support.emailDesc":"Email us for support.","support.emailWrite":"Send email","support.faq":"FAQ","support.faqLink":"Go to FAQ page","faq.title":"Frequently Asked Questions","faq.subtitle":"Answers to the most common questions.","faq.q1":"What is SnapSell?","faq.a1":"SnapSell is a platform that offers product image editing, SEO and price analysis for e-commerce sellers.","faq.q2":"Free plan limits?","faq.a2":"We offer 3 free trial conversions.","faq.q3":"How do I cancel?","faq.a3":"You can cancel your subscription from account settings.","about.title":"About","about.p1":"SnapSell is a platform for e-commerce sellers to quickly and professionally edit product images, remove backgrounds, improve SEO and run price analysis.","about.p2":"Our goal is to help small and medium sellers achieve the same visual quality as big brands. With our AI-powered tools we offer one-click background removal, price analysis, automatic file name suggestions and image library management.","about.missionTitle":"Our mission","about.mission":"To ensure every seller has the visuals to boost sales, regardless of technical knowledge or budget.","about.contactTitle":"Contact","about.contact":"For suggestions and feedback, reach us via our","about.contactLink":"Support","about.contactSuffix":"page.","terms.title":"TERMS OF SERVICE","terms.updated":"Last updated: 2026","terms.s1Title":"1. Acceptance of Terms","terms.s1":`These Terms of Service ("Terms") govern access to and use of the Snapsell platform operated by:

[Aysel Nur Akıncı 1160825918]
Address: [Istanbul/Silivri Mimar Sinan Mah. Fatih Sultan Mehmet Cad. No:38-R Daire:14]
Email: [Snapsell.destek@gmail.com]

By creating an account, accessing the platform, or completing a payment, you agree to these Terms.`,"terms.s2Title":"2. Description of Service","terms.s2":`Snapsell is a cloud-based Software-as-a-Service (SaaS) platform providing:
• AI-powered image generation
• Prompt-based scene creation
• Digital content production tools
• Subscription-based usage plans

No physical products are delivered.`,"terms.s3Title":"3. Account Responsibility","terms.s3":`You agree to:
• Provide accurate information
• Maintain account security
• Not share your account
• Not allow multiple users on one account

We may suspend accounts for suspicious activity.`,"terms.s4Title":"4. Subscription & Billing","terms.s4":`• All prices are in USD.
• Subscriptions renew automatically unless canceled.
• By subscribing, you authorize recurring payments.
• You may cancel anytime before the renewal date.
• No partial refunds for unused time.
• Failure to cancel before renewal results in automatic billing.`,"terms.s5Title":"5. Refund Policy","terms.s5":`Snapsell provides digital services activated immediately after purchase.

Once activated:
• No refunds are provided.
• No refunds for partial use.
• No refunds after subscription renewal.
• Exceptions may apply only in cases of proven technical failure.`,"terms.s6Title":"6. Chargebacks & Fraud","terms.s6":`If a user initiates an unjustified chargeback:
• Account may be suspended or permanently terminated.
• Access may be revoked immediately.
• Fraudulent activity results in immediate termination without refund.`,"terms.s7Title":"7. AI-Generated Content Disclaimer","terms.s7":`• AI-generated outputs are not guaranteed to be accurate.
• Users are responsible for how generated content is used.
• Snapsell does not guarantee non-infringement of third-party rights.
• You agree to use outputs at your own risk.`,"terms.s8Title":"8. Service Availability","terms.s8":`• We do not guarantee uninterrupted or error-free service.
• Maintenance or technical issues may cause temporary interruptions.`,"terms.s9Title":"9. Limitation of Liability","terms.s9":`• Our total liability shall not exceed the amount paid by the user in the most recent billing period.
• We are not liable for indirect, incidental, or consequential damages.`,"terms.s10Title":"10. Governing Law","terms.s10":`• These Terms are governed by the laws of the Republic of Türkiye.
• Istanbul Courts shall have jurisdiction.`,"terms.s11Title":"","terms.s11":"","terms.s12Title":"","terms.s12":"","terms.s13Title":"","terms.s13":"","terms.s14Title":"","terms.s14":"","terms.contact":"For questions, contact us via our","terms.contactLink":"Support","terms.contactSuffix":"page.","footer.distanceSales":"DISTANCE SALES AGREEMENT","footer.preliminaryInfo":"PRELIMINARY INFORMATION FORM","footer.refundPolicy":"REFUND & CANCELLATION POLICY","footer.cookiePolicy":"COOKIE POLICY","footer.kvkk":"KVKK DISCLOSURE","distance.title":"DISTANCE SALES AGREEMENT","distance.updated":"Last updated: 2026","distance.s1Title":"1. Nature of Service","distance.s1":`Snapsell provides digital SaaS access only.

No physical goods are delivered.`,"distance.s2Title":"2. Pricing & Payment","distance.s2":`• Prices are listed in USD.
• Payments are processed electronically.
• Subscriptions renew automatically unless canceled.`,"distance.s3Title":"3. Right of Withdrawal","distance.s3":`Under applicable consumer protection laws, digital services that begin immediately after purchase are not subject to withdrawal rights.

By completing payment, the user expressly consents to immediate service activation and waives the right of withdrawal.`,"distance.s4Title":"4. Cancellation","distance.s4":`• Subscriptions may be canceled via the user dashboard.
• Cancellation becomes effective at the end of the billing cycle.`,"distance.s5Title":"5. Refunds","distance.s5":`• No refunds after service activation.
• Refund exceptions apply only in cases of verified technical failure.`,"distance.s6Title":"","distance.s6":"","distance.s7Title":"","distance.s7":"","distance.s8Title":"","distance.s8":"","distance.s9Title":"","distance.s9":"","distance.s10Title":"","distance.s10":"","distance.s11Title":"","distance.s11":"","distance.s12Title":"","distance.s12":"","distance.contact":"For questions, contact us via our","distance.contactLink":"Support","distance.contactSuffix":"page.","preliminary.title":"PRELIMINARY INFORMATION FORM","preliminary.updated":"Last updated: 2026","preliminary.s1Title":"","preliminary.s1":`Before completing your purchase, you are informed that:

• Snapsell provides digital SaaS services.
• No physical product will be delivered.
• Prices are in USD.
• Subscription renews automatically unless canceled.
• No withdrawal right applies after activation.
• Cancellation is available via dashboard before renewal.

By completing payment, you confirm that you understand and accept these terms.`,"preliminary.s2Title":"","preliminary.s2":"","preliminary.s3Title":"","preliminary.s3":"","preliminary.s4Title":"","preliminary.s4":"","preliminary.s5Title":"","preliminary.s5":"","preliminary.s6Title":"","preliminary.s6":"","preliminary.s7Title":"","preliminary.s7":"","preliminary.s8Title":"","preliminary.s8":"","preliminary.contact":"For questions, contact us via our","preliminary.contactLink":"Support","preliminary.contactSuffix":"page.","refund.title":"REFUND & CANCELLATION POLICY","refund.updated":"Last updated: 2026","refund.s1Title":"Subscription Cancellation","refund.s1":`• Users may cancel at any time before renewal.
• Cancellation prevents future charges but does not refund the current period.`,"refund.s2Title":"Refund Conditions","refund.s2":`• Refunds are not provided once digital service access is granted.
• Refunds may only be issued in cases of:
• Duplicate payment
• Proven technical inability to access service`,"refund.s3Title":"Chargebacks","refund.s3":"• Unjustified chargebacks may result in permanent account termination.","refund.s4Title":"","refund.s4":"","refund.s5Title":"","refund.s5":"","refund.s6Title":"","refund.s6":"","refund.s7Title":"","refund.s7":"","refund.contact":"For questions, contact us via our","refund.contactLink":"Support","refund.contactSuffix":"page.","privacy.title":"PRIVACY POLICY","privacy.updated":"Last updated: 2026","privacy.s1Title":"1. Data Collected","privacy.s1":`We may collect:
• Name
• Email
• IP address
• Device data
• Usage logs
• Payment transaction data
(Card details are processed by payment providers and not stored.)`,"privacy.s2Title":"2. Purpose of Processing","privacy.s2":`• Service delivery
• Subscription management
• Fraud prevention
• Legal compliance
• Platform improvement`,"privacy.s3Title":"3. Data Sharing","privacy.s3":`Data may be shared with:
• Payment processors
• Hosting providers
• Cloud infrastructure providers
• Legal authorities if required

Data may be processed outside your country.`,"privacy.s4Title":"4. Data Retention","privacy.s4":`Data is retained for:
• Duration of subscription
• Legal compliance requirements`,"privacy.s5Title":"5. User Rights","privacy.s5":`Users may request:
• Access
• Correction
• Deletion
• Restriction of processing

Requests may be sent to: Snapsell.destek@gmail.com`,"privacy.s6Title":"","privacy.s6":"","privacy.s7Title":"","privacy.s7":"","privacy.s8Title":"","privacy.s8":"","privacy.s9Title":"","privacy.s9":"","privacy.s10Title":"","privacy.s10":"","privacy.s11Title":"","privacy.s11":"","privacy.contact":"For privacy-related questions, contact us via our","privacy.contactLink":"Support","privacy.contactSuffix":"page.","cookie.title":"COOKIE POLICY","cookie.updated":"Last updated: 2026","cookie.s1Title":"","cookie.s1":`We use cookies to:
• Maintain sessions
• Secure accounts
• Improve performance
• Analyze traffic

Cookie categories:
• Essential cookies
• Performance cookies
• Functional cookies
• Marketing cookies (if applicable)

Users may manage cookies via browser settings.`,"cookie.s2Title":"","cookie.s2":"","cookie.s3Title":"","cookie.s3":"","cookie.s4Title":"","cookie.s4":"","cookie.s5Title":"","cookie.s5":"","cookie.s6Title":"","cookie.s6":"","cookie.s7Title":"","cookie.s7":"","cookie.s8Title":"","cookie.s8":"","cookie.s9Title":"","cookie.s9":"","cookie.contact":"For questions, contact us via our","cookie.contactLink":"Support","cookie.contactSuffix":"page.","cookie.bannerTitle":"Your cookie preferences","cookie.bannerText":"We use cookies to improve your experience. Essential cookies are required for the site to work. Analytics cookies are optional.","cookie.essentialCookies":"Essential cookies","cookie.essentialDesc":"Required for session, security and core features. Cannot be disabled.","cookie.analyticsCookies":"Analytics cookies","cookie.analyticsDesc":"Visit statistics and performance measurement. Optional.","cookie.acceptAll":"Accept all","cookie.essentialOnly":"Essential only","cookie.customize":"Customize","cookie.savePreferences":"Save preferences","cookie.policyLink":"Cookie policy","kvkk.title":"KVKK DISCLOSURE (Turkish Personal Data Protection Law)","kvkk.updated":"Last updated: 2026","kvkk.s1Title":"","kvkk.s1":`This disclosure is provided in Turkish in accordance with Law No. 6698 on the Protection of Personal Data (KVKK). The full Turkish text is available when the site language is set to Turkish.

For general privacy information in English, see our Privacy Policy.`,"kvkk.s2Title":"","kvkk.s2":"","kvkk.s3Title":"","kvkk.s3":"","kvkk.s4Title":"","kvkk.s4":"","kvkk.s5Title":"","kvkk.s5":"","kvkk.s6Title":"","kvkk.s6":"","kvkk.s7Title":"","kvkk.s7":"","kvkk.contact":"For questions, contact us via our","kvkk.contactLink":"Support","kvkk.contactSuffix":"page.","account.title":"Account settings","account.subtitle":"Your profile, plan and usage.","account.profile":"Profile","account.name":"Name","account.membership":"Membership","account.usageSummary":"Usage summary","account.remainingConversions":"Remaining conversions","account.conversionNote":"1 conversion = 1 product image operation","account.totalConversions":"Total conversions","account.sinceAccount":"Since account creation","account.planDetail":"Plan details","account.imageEdit":"Image editing","account.subscription":"Subscription","account.renewUpgrade":"Renew or upgrade plan","account.renewDesc":"You can renew or change your plan from the pricing page.","account.goPricing":"Go to pricing","account.cancelTitle":"Cancel subscription","account.cancelDesc":"Contact support for cancellation or plan changes.","account.cancel":"Cancel","account.renewingSubscription":"Renewing subscription","account.renewingSubscriptionDesc":"Your subscription is automatically renewed unless cancelled. You can cancel at any time before renewal.","account.session":"Session","account.logoutDesc":"Sign out securely from your account.","account.logout":"Sign out","account.errorLoad":"Could not load account info","account.errorGeneric":"An error occurred","account.pleaseLogin":"Make sure you are signed in.","account.loadFailed":"Could not load account info.","library.title":"Library","library.empty":"No uploads yet. Upload a photo from the editor.","library.note":"Note:","library.noteText":"The library is stored in your browser (localStorage). The latest 20 conversions are shown; older entries are removed automatically. Data stays on this device only and is not visible on other devices or browsers.","editor.title":"Product studio image","editor.pleaseSelectImage":"Please select an image (PNG, JPG, WEBP).","editor.dragOrClick":"Drag an image here or click","editor.formats":"PNG, JPG or WEBP","editor.uploadedImage":"Uploaded image","editor.uploadedAlt":"Uploaded","editor.selectDifferent":"Choose different image","editor.whereList":"Where will you list this product?","editor.multiStore":"You can select multiple stores.","editor.photoQuality":"Photo quality","editor.selectStyle":"Choose image style.","editor.qualityStudio":"Studio","editor.qualityPro":"Professional","editor.qualityLuxury":"Luxury","editor.conversionText":"Conversion text","editor.conversionHint":"Background description (optional).","editor.promptPlaceholder":"E.g. professional studio, neutral background, soft light","editor.priceAnalysisTitle":"Describe product for price analysis","editor.priceAnalysisHint":"This text is used for price analysis; you can enter product name, category or short description.","editor.pricePlaceholder":"E.g. Women's leather jacket, black, size M","editor.processing":"Processing… (may take 1–2 min)","editor.convert":"Convert","editor.original":"Original (uploaded)","editor.originalHint":"You can use this image if you like it.","editor.result":"Result (studio image)","editor.resultHint":"Background changed. If you don't like it, use the original above.","editor.resultAlt":"Edit result","editor.openInNewTab":"Open result in new tab","editor.downloadOrOpen":"Open / download in new tab →","editor.priceAnalysis":"Price analysis","editor.priceSource":"Source","editor.priceMin":"Min","editor.priceAvg":"Avg","editor.priceMax":"Max","editor.priceDisclaimer":"These prices are average analysis figures, not sales recommendations.","editor.failed":"Operation failed","editor.timeout":"Request timed out. Server or PhotoRoom did not respond; please try again.","editor.renewPhotoRoom":"Renew PhotoRoom plan →","editor.paymentBalance":"Payment / balance →","editor.proPlanRequired":"Pro plan (Image editing) required","editor.proPlanDesc":"This page uses PhotoRoom to remove background and create a new one. You need an Image editing (Pro) plan to use it.","editor.goPricing":"Go to pricing","editor.imageLoadFailed":"Image could not be loaded directly."}},N="snapsell_lang",D=n.createContext(null);function re({children:a}){const[r,o]=n.useState(()=>{if(typeof window>"u")return"tr";const l=localStorage.getItem(N);return l==="en"||l==="tr"?l:"tr"});n.useEffect(()=>{typeof window>"u"||(localStorage.setItem(N,r),document.documentElement.lang=r==="en"?"en":"tr")},[r]);const u=n.useCallback(l=>{o(l)},[]),i=n.useCallback(l=>te[r][l]??l,[r]);return e.jsx(D.Provider,{value:{locale:r,setLocale:u,t:i},children:a})}function T(){const a=n.useContext(D);if(!a)throw new Error("useLanguage must be used within LanguageProvider");return a}const S=[{code:"tr",label:"Türkçe"},{code:"en",label:"English"}];function K(){const{locale:a,setLocale:r,t:o}=T(),[u,i]=n.useState(!1),l=n.useRef(null);return n.useEffect(()=>{function s(c){l.current&&!l.current.contains(c.target)&&i(!1)}return document.addEventListener("mousedown",s),()=>document.removeEventListener("mousedown",s)},[]),S.find(s=>s.code===a)??S[0],e.jsxs("div",{className:"relative",ref:l,children:[e.jsxs("button",{type:"button",onClick:()=>i(s=>!s),className:"flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-[#FF5A5F] transition-colors text-sm font-medium","aria-label":o("nav.language")||"Dil seçin","aria-expanded":u,children:[e.jsx(H,{className:"w-4 h-4"}),e.jsx("span",{className:"uppercase",children:a})]}),u&&e.jsx("div",{className:"absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50",children:S.map(s=>e.jsx("button",{type:"button",onClick:()=>{r(s.code),i(!1)},className:`block w-full text-left px-4 py-2 text-sm transition-colors ${a===s.code?"bg-[#FF5A5F]/10 text-[#FF5A5F] font-medium":"text-gray-700 hover:bg-gray-50"}`,children:s.label},s.code))})]})}const C="snapsell_cookie_consent";function I(){if(typeof localStorage>"u")return null;try{const a=localStorage.getItem(C);if(!a)return null;const r=JSON.parse(a);if(r&&typeof r.essential=="boolean"&&typeof r.analytics=="boolean")return r}catch{}return null}function le(){const a=I();return!!(a!=null&&a.analytics)}function se(){const{t:a}=T(),r=M(),[o,u]=n.useState(!1),[i,l]=n.useState(!1),[s,c]=n.useState(!0);n.useEffect(()=>{I()===null&&u(!0)},[]);const g=(d,f)=>{const b={essential:!0,analytics:f,createdAt:Date.now()};try{localStorage.setItem(C,JSON.stringify(b))}catch{}u(!1),l(!1)},t=()=>g(!0,!0),y=()=>g(!0,!1),h=()=>g(!0,s);return o?e.jsxs("div",{className:"fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-[100] rounded-xl bg-white border border-gray-200 shadow-lg p-4 text-gray-800",role:"dialog","aria-labelledby":"cookie-banner-title","aria-describedby":"cookie-banner-desc",children:[e.jsx("h2",{id:"cookie-banner-title",className:"text-base font-semibold text-gray-900 mb-1",children:a("cookie.bannerTitle")}),e.jsxs("p",{id:"cookie-banner-desc",className:"text-sm text-gray-600 mb-3",children:[a("cookie.bannerText")," ",e.jsx("button",{type:"button",onClick:()=>r("/cerez-politikasi"),className:"text-[#FF5A5F] hover:underline font-inherit text-inherit p-0 border-0 bg-transparent cursor-pointer inline",children:a("cookie.policyLink")})]}),i?e.jsxs("div",{className:"space-y-3 pt-2 border-t border-gray-200",children:[e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"font-medium text-gray-900 text-sm",children:a("cookie.essentialCookies")}),e.jsx("p",{className:"text-xs text-gray-500",children:a("cookie.essentialDesc")})]}),e.jsx("span",{className:"text-gray-400 text-sm shrink-0",children:"✓"})]}),e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"font-medium text-gray-900 text-sm",children:a("cookie.analyticsCookies")}),e.jsx("p",{className:"text-xs text-gray-500",children:a("cookie.analyticsDesc")})]}),e.jsxs("label",{className:"flex items-center gap-2 shrink-0 cursor-pointer",children:[e.jsx("input",{type:"checkbox",checked:s,onChange:d=>c(d.target.checked),className:"rounded border-gray-400 text-[#FF5A5F] focus:ring-[#FF5A5F]"}),e.jsx("span",{className:"text-sm text-gray-600 sr-only",children:a("cookie.analyticsCookies")})]})]}),e.jsxs("div",{className:"flex flex-wrap gap-2 pt-1",children:[e.jsx("button",{type:"button",onClick:h,className:"px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 transition",children:a("cookie.savePreferences")}),e.jsx("button",{type:"button",onClick:()=>l(!1),className:"px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition",children:a("cookie.customize")})]})]}):e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsx("button",{type:"button",onClick:t,className:"px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 transition",children:a("cookie.acceptAll")}),e.jsx("button",{type:"button",onClick:y,className:"px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition",children:a("cookie.essentialOnly")}),e.jsx("button",{type:"button",onClick:()=>l(!0),className:"px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition",children:a("cookie.customize")})]})]}):null}const oe=typeof window<"u"?window.location.origin:"";function ce(){var g;const[a,r]=n.useState(!1),o=B(),{user:u}=ne(),{t:i}=T();n.useEffect(()=>{typeof sessionStorage>"u"||sessionStorage.getItem("snapsell_visit_sent")||le()&&(sessionStorage.setItem("snapsell_visit_sent","1"),fetch(oe+"/api/track-visit",{method:"GET"}).catch(()=>{}))},[]);const l=[{nameKey:"nav.home",href:"/",external:!1},{nameKey:"nav.imageEdit",href:"/gorsel-duzenleme",external:!1},{nameKey:"nav.examples",href:"/ornekler",external:!1},{nameKey:"nav.pricing",href:"/fiyatlandirma",external:!1},{nameKey:"nav.support",href:"/destek",external:!1},{nameKey:"nav.faq",href:"/sss",external:!1},{nameKey:"nav.about",href:"/hakkimizda",external:!1}],s=[{nameKey:"nav.imageEdit",href:"/gorsel-duzenleme",external:!1},{nameKey:"nav.library",href:"/kutuphane",external:!1},{nameKey:"nav.accountSettings",href:"/hesap-ayarlari",external:!1}],c=t=>t==="/"?o.pathname==="/"||o.pathname==="/dashboard"||o.pathname==="/dashboard/":o.pathname.startsWith(t);return e.jsxs("div",{className:"min-h-screen bg-gray-50",children:[e.jsxs("nav",{className:"bg-white shadow-sm sticky top-0 z-50",children:[e.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",children:e.jsxs("div",{className:"flex justify-between items-center h-16",children:[e.jsx(m,{to:"/",className:"flex items-center",children:e.jsx("span",{className:"text-2xl font-bold",style:{color:"#FF5A5F"},children:"SnapSell"})}),e.jsx("div",{className:"hidden md:flex items-center space-x-8",children:l.map(t=>e.jsx(m,{to:t.href,className:`transition-colors ${c(t.href)?"text-[#FF5A5F]":"text-gray-700 hover:text-[#FF5A5F]"}`,children:i(t.nameKey)},t.nameKey))}),e.jsxs("div",{className:"hidden md:flex items-center space-x-2",children:[e.jsx(K,{}),u?e.jsxs("div",{className:"relative group",children:[e.jsxs("button",{type:"button",className:"flex items-center space-x-2 text-gray-700 hover:text-[#FF5A5F] transition-colors",children:[e.jsx(P,{className:"w-6 h-6"}),e.jsx("span",{children:((g=u.email)==null?void 0:g.split("@")[0])||i("nav.myAccount")})]}),e.jsx("div",{className:"absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100",children:s.map(t=>t.external?e.jsx("a",{href:t.href,className:"block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-[#FF5A5F] first:rounded-t-lg last:rounded-b-lg",children:i(t.nameKey)},t.nameKey):e.jsx(m,{to:t.href,className:"block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-[#FF5A5F] first:rounded-t-lg last:rounded-b-lg",children:i(t.nameKey)},t.nameKey))})]}):e.jsxs(e.Fragment,{children:[e.jsx("a",{href:`${typeof window<"u"?window.location.origin:""}/login`,className:"text-gray-700 hover:text-[#FF5A5F] transition-colors font-medium",children:i("nav.login")}),e.jsx("a",{href:`${typeof window<"u"?window.location.origin:""}/register`,className:"px-4 py-2 bg-[#FF5A5F] text-white rounded-lg hover:bg-[#FF5A5F]/90 transition-colors font-medium",children:i("nav.register")}),e.jsxs("div",{className:"relative group",children:[e.jsxs("button",{type:"button",className:"flex items-center space-x-2 text-gray-700 hover:text-[#FF5A5F] transition-colors",children:[e.jsx(P,{className:"w-6 h-6"}),e.jsx("span",{children:i("nav.myAccount")})]}),e.jsx("div",{className:"absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100",children:s.map(t=>t.external?e.jsx("a",{href:t.href,className:"block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-[#FF5A5F] first:rounded-t-lg last:rounded-b-lg",children:i(t.nameKey)},t.nameKey):e.jsx(m,{to:t.href,className:"block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-[#FF5A5F] first:rounded-t-lg last:rounded-b-lg",children:i(t.nameKey)},t.nameKey))})]})]})]}),e.jsx("button",{type:"button",onClick:()=>r(!a),className:"md:hidden p-2 text-gray-700","aria-label":"Menü",children:a?e.jsx(V,{className:"w-6 h-6"}):e.jsx(q,{className:"w-6 h-6"})})]})}),a&&e.jsx("div",{className:"md:hidden border-t border-gray-200 bg-white",children:e.jsxs("div",{className:"px-2 pt-2 pb-3 space-y-1",children:[l.map(t=>e.jsx(m,{to:t.href,onClick:()=>r(!1),className:`block px-3 py-2 rounded-md ${c(t.href)?"bg-[#FF5A5F] text-white":"text-gray-700 hover:bg-gray-100"}`,children:i(t.nameKey)},t.nameKey)),e.jsxs("div",{className:"border-t border-gray-200 pt-2 mt-2 space-y-1 flex flex-wrap items-center gap-2",children:[e.jsx("div",{className:"w-full px-3 py-2",children:e.jsx(K,{})}),e.jsx("a",{href:`${typeof window<"u"?window.location.origin:""}/login`,className:"block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100",onClick:()=>r(!1),children:i("nav.login")}),e.jsx("a",{href:`${typeof window<"u"?window.location.origin:""}/register`,className:"block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100",onClick:()=>r(!1),children:i("nav.register")}),s.map(t=>t.external?e.jsx("a",{href:t.href,onClick:()=>r(!1),className:"block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100",children:i(t.nameKey)},t.nameKey):e.jsx(m,{to:t.href,onClick:()=>r(!1),className:"block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100",children:i(t.nameKey)},t.nameKey))]})]})})]}),e.jsx("main",{children:e.jsx(G,{})}),e.jsx("footer",{className:"bg-gray-900 text-gray-300 mt-20",children:e.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12",children:[e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-8",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-2xl font-bold text-white mb-4",children:"SnapSell"}),e.jsx("p",{className:"text-sm",children:i("footer.description")})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-white mb-4",children:i("footer.product")}),e.jsxs("ul",{className:"space-y-2 text-sm",children:[e.jsx("li",{children:e.jsx(m,{to:"/fiyatlandirma",className:"hover:text-white",children:i("nav.pricing")})}),e.jsx("li",{children:e.jsx(m,{to:"/gorsel-duzenleme",className:"hover:text-white",children:i("nav.imageEdit")})}),e.jsx("li",{children:e.jsx(m,{to:"/kutuphane",className:"hover:text-white",children:i("nav.library")})})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-white mb-4",children:i("nav.support")}),e.jsxs("ul",{className:"space-y-2 text-sm",children:[e.jsx("li",{children:e.jsx(m,{to:"/destek",className:"hover:text-white",children:i("footer.contact")})}),e.jsx("li",{children:e.jsx(m,{to:"/sss",className:"hover:text-white",children:i("nav.faq")})}),e.jsx("li",{children:e.jsx(m,{to:"/hakkimizda",className:"hover:text-white",children:i("nav.about")})})]})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-white mb-4",children:i("footer.legal")}),e.jsxs("ul",{className:"space-y-2 text-sm",children:[e.jsx("li",{children:e.jsx(m,{to:"/kullanim-kosullari",className:"hover:text-white",children:i("footer.terms")})}),e.jsx("li",{children:e.jsx(m,{to:"/mesafeli-satis-sozlesmesi",className:"hover:text-white",children:i("footer.distanceSales")})}),e.jsx("li",{children:e.jsx(m,{to:"/on-bilgilendirme-formu",className:"hover:text-white",children:i("footer.preliminaryInfo")})}),e.jsx("li",{children:e.jsx(m,{to:"/iptal-iade-politikasi",className:"hover:text-white",children:i("footer.refundPolicy")})}),e.jsx("li",{children:e.jsx(m,{to:"/gizlilik",className:"hover:text-white",children:i("footer.privacy")})}),e.jsx("li",{children:e.jsx(m,{to:"/cerez-politikasi",className:"hover:text-white",children:i("footer.cookiePolicy")})}),e.jsx("li",{children:e.jsx(m,{to:"/kvkk-aydinlatma-metni",className:"hover:text-white",children:i("footer.kvkk")})})]})]})]}),e.jsxs("div",{className:"border-t border-gray-600 mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8 bg-gray-700 rounded-lg",children:[e.jsx("span",{className:"sr-only",children:"Kabul edilen ödeme kartları:"}),e.jsxs("div",{className:"flex flex-wrap items-center justify-center gap-x-10 gap-y-4",children:[e.jsx("img",{src:"/dashboard/images/payment-cards/visa.svg",alt:"Visa",className:"h-10 w-auto object-contain",width:"80",height:"28"}),e.jsx("img",{src:"/dashboard/images/payment-cards/mastercard.svg",alt:"Mastercard",className:"h-10 w-auto object-contain",width:"48",height:"32"}),e.jsx("img",{src:"/dashboard/images/payment-cards/troy.svg",alt:"Troy",className:"h-9 w-auto object-contain",width:"90",height:"28"}),e.jsx("img",{src:"/dashboard/images/payment-cards/maestro.svg",alt:"Maestro",className:"h-9 w-auto object-contain",width:"100",height:"28"}),e.jsx("img",{src:"/dashboard/images/payment-cards/amex.svg",alt:"American Express",className:"h-9 w-auto object-contain",width:"90",height:"28"}),e.jsx("img",{src:"/dashboard/images/payment-cards/discover.svg",alt:"Discover",className:"h-9 w-auto object-contain",width:"120",height:"28"}),e.jsx("img",{src:"/dashboard/images/payment-cards/diners.svg",alt:"Diners Club",className:"h-9 w-auto object-contain",width:"130",height:"28"})]}),e.jsxs("p",{className:"text-center text-base text-gray-200 mt-5 space-y-1",children:[e.jsx("span",{className:"block",children:"All transactions are processed via PCI DSS Level 1 certified payment providers."}),e.jsx("span",{className:"block",children:"We use 256-bit SSL encryption and do not store card data."})]})]}),e.jsx("div",{className:"border-t border-gray-800 mt-6 pt-6 text-sm text-center",children:e.jsx("p",{children:i("footer.copyright")})})]})}),e.jsx(se,{})]})}class de extends n.Component{constructor(){super(...arguments);A(this,"state",{hasError:!1})}static getDerivedStateFromError(o){return{hasError:!0,error:o}}render(){return this.state.hasError?this.props.fallback?this.props.fallback:e.jsx("div",{className:"min-h-[50vh] flex items-center justify-center p-8 bg-gray-50",children:e.jsxs("div",{className:"max-w-md text-center",children:[e.jsx("h2",{className:"text-xl font-bold text-gray-900 mb-2",children:"Bir hata oluştu"}),e.jsx("p",{className:"text-gray-600 mb-4",children:"İşleminiz sırasında beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya ana sayfaya dönün."}),e.jsxs("div",{className:"flex gap-3 justify-center",children:[e.jsx("button",{type:"button",onClick:()=>window.location.reload(),className:"px-4 py-2 bg-[#FF5A5F] text-white rounded-lg hover:bg-[#FF5A5F]/90",children:"Sayfayı yenile"}),e.jsx("a",{href:"/dashboard",className:"px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700",children:"Ana sayfa"})]})]})}):this.props.children}}const me=n.lazy(()=>p(()=>import("./HomePage-C1ft4F3S.js"),__vite__mapDeps([0,1,2])).then(a=>({default:a.HomePage}))),ue=n.lazy(()=>p(()=>import("./PricingPage-BxQZIaLp.js"),__vite__mapDeps([3,1,2])).then(a=>({default:a.PricingPage}))),ke=n.lazy(()=>p(()=>import("./ExamplesPage-DYcF8Rte.js"),__vite__mapDeps([4,1,2])).then(a=>({default:a.ExamplesPage}))),pe=n.lazy(()=>p(()=>import("./SupportPage-CwtZPDak.js"),__vite__mapDeps([5,1,2])).then(a=>({default:a.SupportPage}))),ye=n.lazy(()=>p(()=>import("./FAQPage-CnZnrtJY.js"),__vite__mapDeps([6,1,2])).then(a=>({default:a.FAQPage}))),he=n.lazy(()=>p(()=>import("./AboutPage-OJMMtB8E.js"),__vite__mapDeps([7,1,2])).then(a=>({default:a.AboutPage}))),ge=n.lazy(()=>p(()=>import("./TermsPage-BfOBv-oq.js"),__vite__mapDeps([8,1,2])).then(a=>({default:a.TermsPage}))),fe=n.lazy(()=>p(()=>import("./DistanceSalesPage-CiM2sjD1.js"),__vite__mapDeps([9,1,2])).then(a=>({default:a.DistanceSalesPage}))),ve=n.lazy(()=>p(()=>import("./PreliminaryInfoPage-BELT_KIQ.js"),__vite__mapDeps([10,1,2])).then(a=>({default:a.PreliminaryInfoPage}))),be=n.lazy(()=>p(()=>import("./RefundPolicyPage-Co8PYeSN.js"),__vite__mapDeps([11,1,2])).then(a=>({default:a.RefundPolicyPage}))),xe=n.lazy(()=>p(()=>import("./PrivacyPage-BeX0ocRH.js"),__vite__mapDeps([12,1,2])).then(a=>({default:a.PrivacyPage}))),ze=n.lazy(()=>p(()=>import("./CookiePolicyPage-BKuoMgjK.js"),__vite__mapDeps([13,1,2])).then(a=>({default:a.CookiePolicyPage}))),Se=n.lazy(()=>p(()=>import("./KvkkPage-UcJelNJ4.js"),__vite__mapDeps([14,1,2])).then(a=>({default:a.KvkkPage}))),Te=n.lazy(()=>p(()=>import("./EditorReplicatePage-DOJzZxPV.js"),__vite__mapDeps([15,1,2])).then(a=>({default:a.EditorReplicatePage}))),Ae=n.lazy(()=>p(()=>import("./LibraryPage-D2HazZ9e.js"),__vite__mapDeps([16,1,2])).then(a=>({default:a.LibraryPage}))),Pe=n.lazy(()=>p(()=>import("./AccountPage-CMl7FXn1.js"),__vite__mapDeps([17,1,2])).then(a=>({default:a.AccountPage}))),je=n.lazy(()=>p(()=>import("./AdminPage-DiEmVsVG.js"),__vite__mapDeps([18,1,2])).then(a=>({default:a.AdminPage})));function k(){return e.jsx("div",{className:"flex items-center justify-center min-h-[50vh]",children:e.jsx("div",{className:"animate-pulse text-gray-500",children:"Yükleniyor…"})})}const we=Y([{path:"/",Component:ce,errorElement:e.jsx(de,{}),children:[{index:!0,element:e.jsx(n.Suspense,{fallback:e.jsx(k,{}),children:e.jsx(me,{})})},{path:"admin",element:e.jsx(n.Suspense,{fallback:e.jsx(k,{}),children:e.jsx(je,{})})},{path:"ornekler",element:e.jsx(n.Suspense,{fallback:e.jsx(k,{}),children:e.jsx(ke,{})})},{path:"fiyatlandirma",element:e.jsx(n.Suspense,{fallback:e.jsx(k,{}),children:e.jsx(ue,{})})},{path:"destek",element:e.jsx(n.Suspense,{fallback:e.jsx(k,{}),children:e.jsx(pe,{})})},{path:"sss",element:e.jsx(n.Suspense,{fallback:e.jsx(k,{}),children:e.jsx(ye,{})})},{path:"editor",element:e.jsx(U,{to:"/gorsel-duzenleme",replace:!0})},{path:"gorsel-duzenleme",element:e.jsx(n.Suspense,{fallback:e.jsx(k,{}),children:e.jsx(Te,{})})},{path:"kutuphane",element:e.jsx(n.Suspense,{fallback:e.jsx(k,{}),children:e.jsx(Ae,{})})},{path:"hesap-ayarlari",element:e.jsx(n.Suspense,{fallback:e.jsx(k,{}),children:e.jsx(Pe,{})})},{path:"hakkimizda",element:e.jsx(n.Suspense,{fallback:e.jsx(k,{}),children:e.jsx(he,{})})},{path:"kullanim-kosullari",element:e.jsx(n.Suspense,{fallback:e.jsx(k,{}),children:e.jsx(ge,{})})},{path:"mesafeli-satis-sozlesmesi",element:e.jsx(n.Suspense,{fallback:e.jsx(k,{}),children:e.jsx(fe,{})})},{path:"on-bilgilendirme-formu",element:e.jsx(n.Suspense,{fallback:e.jsx(k,{}),children:e.jsx(ve,{})})},{path:"iptal-iade-politikasi",element:e.jsx(n.Suspense,{fallback:e.jsx(k,{}),children:e.jsx(be,{})})},{path:"gizlilik",element:e.jsx(n.Suspense,{fallback:e.jsx(k,{}),children:e.jsx(xe,{})})},{path:"cerez-politikasi",element:e.jsx(n.Suspense,{fallback:e.jsx(k,{}),children:e.jsx(ze,{})})},{path:"kvkk-aydinlatma-metni",element:e.jsx(n.Suspense,{fallback:e.jsx(k,{}),children:e.jsx(Se,{})})}]}],{basename:"/dashboard"}),L=document.getElementById("root");L&&W.createRoot(L).render(e.jsx(n.StrictMode,{children:e.jsx(re,{children:e.jsx(ie,{children:e.jsx($,{router:we})})})}));export{T as a,ne as u};
