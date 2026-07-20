import React, { useState, useMemo } from 'react';
import { TranslationEditor } from "./components/TranslationEditor/TranslationEditor";
import { CertificateCard } from "./components/CertificateCard/CertificateCard";
import { useFreighter } from "./hooks/useFreighter";
import { registerTranslationOnChain } from "./services/stellar";

const metinKutuphanesi = [
  { id: 1, level: "A1", language: "Turkish", type: "Daily Life", title: "Ece'nin Günü", text: "Merhaba! Benim adım Ece. On dokuz yaşındayım ve üniversite öğrencisiyim. Her sabah saat yedide uyanırım. Kahvaltıda genellikle peynir, ekmek ve çay içerim. Daha sonra otobüsle okula giderim. En sevdiğim ders İngilizcedir çünkü yeni kelimeler öğrenmeyi seviyorum. Okuldan sonra arkadaşlarımla kafeye gideriz. Akşam eve dönünce biraz kitap okur ve erken uyurum. Hafta sonları ailemle yürüyüş yapmayı çok severim.", expected: "Hello! My name is Ece. I am nineteen years old and I am a university student. Every morning I wake up at seven o'clock. For breakfast I usually have cheese, bread, and tea. Then I go to school by bus. My favorite subject is English because I enjoy learning new words. After school, I go to a café with my friends. In the evening I read a book and go to bed early. On weekends I love taking walks with my family." },
  { id: 2, level: "A1", language: "English", type: "Daily Conversation", title: "Daniel's Routine", text: "My name is Daniel. I live in a small city with my parents and my sister. Every morning I make my bed and eat breakfast before going to work. I enjoy listening to music while walking. In the afternoon I meet my friends in the park. We sometimes play football or drink coffee together. At night I watch a short movie before I sleep. I like my life because it is simple and peaceful.", expected: "Benim adım Daniel. Anne, baba ve kız kardeşimle birlikte küçük bir şehirde yaşıyorum. Her sabah yatağımı toplar ve işe gitmeden önce kahvaltı yaparım. Yürürken müzik dinlemeyi severim. Öğleden sonra arkadaşlarımla parkta buluşurum. Bazen birlikte futbol oynar ya da kahve içeriz. Gece uyumadan önce kısa bir film izlerim. Hayatımı seviyorum çünkü sade ve huzurlu." },
  { id: 3, level: "A1", language: "German", type: "Alltag", title: "Lukas' Tag", text: "Guten Tag! Ich heiße Lukas. Ich bin achtzehn Jahre alt und wohne in Berlin. Jeden Morgen fahre ich mit dem Fahrrad zur Schule. Meine Lieblingsfarbe ist Blau und mein Lieblingsfach ist Geschichte. Nach der Schule spiele ich oft Gitarre oder lese ein Buch. Meine Familie isst jeden Abend zusammen. Danach gehen wir manchmal spazieren. Ich freue mich immer auf das Wochenende.", expected: "İyi günler! Benim adım Lukas. On sekiz yaşındayım ve Berlin'de yaşıyorum. Her sabah bisikletle okula giderim. En sevdiğim renk mavidir ve en sevdiğim ders tarihtir. Okuldan sonra sık sık gitar çalar veya kitap okurum. Ailem her akşam birlikte yemek yer. Daha sonra bazen yürüyüşe çıkarız. Hafta sonunu her zaman sabırsızlıkla beklerim." },
  { id: 4, level: "A2", language: "Turkish", type: "Short Story", title: "Cumartesi Pikniği", text: "Geçen cumartesi sabah erkenden uyandım çünkü arkadaşlarımla pikniğe gidecektim. Hava güneşliydi ama biraz rüzgâr vardı. Evden çıkmadan önce annem bana sandviç ve meyve hazırladı. Parkta uzun süre yürüdük, fotoğraflar çektik ve birlikte oyun oynadık. Akşam eve döndüğümde yorgundum fakat çok mutluydum. Bir sonraki hafta sonu yine aynı yere gitmeyi planlıyoruz.", expected: "Last Saturday I woke up early because I was going on a picnic with my friends. The weather was sunny, but it was a little windy. Before leaving home, my mother prepared sandwiches and fruit for me. We walked around the park for a long time, took photos, and played games together. When I returned home in the evening, I was tired but very happy. We are planning to go to the same place again next weekend." },
  { id: 5, level: "A2", language: "English", type: "Personal Letter", title: "Letter to Anna", text: "Dear Anna, How are you? I hope everything is going well. Last month my family moved to a new apartment near the city center. At first I was nervous because I did not know anyone, but now I have made several new friends. There is a beautiful library close to my home, and I spend many afternoons reading there. I would love to see you during the summer holiday. Maybe we can visit the museum together. Best wishes, Emily", expected: "Sevgili Anna, Nasılsın? Umarım her şey yolundadır. Geçen ay ailem şehir merkezine yakın yeni bir daireye taşındı. İlk başta kimseyi tanımadığım için biraz gergindim ama şimdi birkaç yeni arkadaş edindim. Evimin yakınında çok güzel bir kütüphane var ve öğleden sonralarının çoğunu orada kitap okuyarak geçiriyorum. Yaz tatilinde seni görmeyi çok isterim. Belki birlikte müzeyi ziyaret ederiz. Sevgiler, Emily" },
  { id: 6, level: "A2", language: "German", type: "Reisebericht", title: "Österreich Reise", text: "Im letzten Sommer machte ich mit meiner Familie eine Reise nach Österreich. Wir fuhren mit dem Zug, weil wir die Landschaft genießen wollten. Jeden Tag besuchten wir einen anderen Ort und probierten traditionelle Speisen. Besonders gut gefiel mir ein kleiner See in den Bergen. Das Wasser war klar und die Luft war sehr frisch. Am Ende der Reise kauften wir einige Souvenirs für unsere Freunde. Es war einer der schönsten Urlaube meines Lebens.", expected: "Geçen yaz ailemle birlikte Avusturya'ya bir gezi yaptım. Manzaranın tadını çıkarmak istediğimiz için trenle gittik. Her gün farklı bir yeri ziyaret ettik ve geleneksel yemekler denedik. En çok dağların arasındaki küçük bir gölü beğendim. Su çok berraktı ve hava oldukça temizdi. Yolculuğun sonunda arkadaşlarımız için birkaç hatıra aldık. Hayatımın en güzel tatillerinden biriydi." },
  { id: 7, level: "B1", language: "Turkish", type: "News", title: "İstasyon Açılışı", text: "Geçtiğimiz hafta sonu şehir merkezindeki eski tren istasyonu, uzun süren restorasyon çalışmalarının ardından yeniden ziyarete açıldı. Açılış törenine yüzlerce kişi katıldı ve etkinlik boyunca yerel müzik grupları konser verdi. Belediye yetkilileri, istasyonun artık yalnızca bir ulaşım noktası değil, aynı zamanda kültürel etkinliklere ev sahipliği yapacak bir merkez olacağını açıkladı. Ziyaretçiler, tarihi binanın korunarak modern bir yapıya dönüştürülmesinden memnun olduklarını söyledi. Önümüzdeki aylarda burada fotoğraf sergileri, kitap fuarları ve çeşitli atölyelerin düzenlenmesi planlanıyor.", expected: "Last weekend, the old train station in the city center reopened after a long restoration project. Hundreds of people attended the opening ceremony, and local music groups performed throughout the event. City officials announced that the station would no longer serve only as a transportation hub but also as a cultural center hosting various activities. Visitors said they were pleased that the historic building had been preserved while being adapted for modern use. In the coming months, photography exhibitions, book fairs, and creative workshops are expected to take place there." },
  { id: 8, level: "B1", language: "English", type: "Blog", title: "Language Learning", text: "When I started learning German two years ago, I believed that memorizing vocabulary would be enough. However, I soon realized that understanding a language also means understanding the people who speak it. Reading short stories, listening to podcasts, and watching documentaries helped me discover different traditions and ways of thinking. Although I still make mistakes, I feel much more confident than before. My next goal is to spend a few weeks in Germany so that I can improve my speaking skills through everyday conversations with native speakers.", expected: "İki yıl önce Almanca öğrenmeye başladığımda kelime ezberlemenin yeterli olacağını düşünüyordum. Ancak kısa sürede bir dili anlamanın, o dili konuşan insanları da anlamak anlamına geldiğini fark ettim. Kısa hikâyeler okumak, podcast dinlemek ve belgeseller izlemek bana farklı gelenekleri ve düşünce biçimlerini tanıma fırsatı verdi. Hâlâ hata yapıyorum ama eskisine göre kendime çok daha fazla güveniyorum. Bir sonraki hedefim, ana dili Almanca olan insanlarla günlük konuşmalar yaparak konuşma becerimi geliştirmek için birkaç hafta Almanya'da kalmak." },
  { id: 9, level: "B1", language: "German", type: "Memoir", title: "Kindheitserinnerung", text: "Als Kind verbrachte ich fast jeden Sommer bei meinen Großeltern auf dem Land. Morgens weckte mich der Gesang der Vögel, und nach dem Frühstück half ich meinem Großvater im Garten. Meine Großmutter erzählte oft Geschichten aus ihrer Kindheit, während sie frisches Brot backte. Damals schien jeder Tag langsam zu vergehen, doch heute weiß ich, wie wertvoll diese einfachen Momente waren. Wenn ich gestresst bin, denke ich oft an diese Zeit zurück.", expected: "Çocukken neredeyse her yazımı köyde yaşayan büyükannem ve büyükbabamın yanında geçirirdim. Sabahları kuş sesleriyle uyanır, kahvaltıdan sonra büyükbabama bahçede yardım ederdim. Büyükannem taze ekmek yaparken bana sık sık çocukluğundan hikâyeler anlatırdı. O zamanlar günler çok yavaş geçiyor gibi görünürdü ama bugün bu sade anların ne kadar değerli olduğunu biliyorum. Ne zaman stresli olsam o günleri hatırlarım." },
  { id: 10, level: "B2", language: "Turkish", type: "Essay", title: "Bilgi Çağı", text: "Teknolojinin gelişmesiyle birlikte insanlar bilgiye hiç olmadığı kadar hızlı ulaşabiliyor. Ancak bilgiye kolay erişebilmek, onu doğru değerlendirebildiğimiz anlamına gelmiyor. Özellikle sosyal medyada paylaşılan içeriklerin büyük bir kısmı doğrulanmadan yayılıyor ve bu durum yanlış bilgilerin kısa sürede geniş kitlelere ulaşmasına neden oluyor. Bu nedenle bireylerin yalnızca okuduklarına inanması değil, aynı zamanda farklı kaynakları karşılaştırarak eleştirel düşünme becerilerini geliştirmesi gerekiyor.", expected: "With the rapid development of technology, people can access information faster than ever before. However, easy access to information does not necessarily mean that we are able to evaluate it correctly. A significant amount of content shared on social media spreads without verification, allowing misinformation to reach large audiences within a short period. For this reason, individuals should not simply believe everything they read but should compare different sources and strengthen their critical thinking skills." },
  { id: 11, level: "B2", language: "English", type: "Science Article", title: "The Forest Balance", text: "For centuries, forests were viewed primarily as sources of timber and agricultural land. Today, however, scientists recognize that they perform a far greater role in maintaining the balance of life on Earth. Forests regulate regional climates, store enormous amounts of carbon, protect biodiversity, and influence rainfall patterns across entire continents. Recent research also suggests that trees communicate through underground fungal networks, exchanging nutrients and warning neighboring plants about environmental threats.", expected: "Yüzyıllar boyunca ormanlar öncelikle kereste ve tarım arazisi kaynağı olarak görüldü. Ancak günümüzde bilim insanları, onların Dünya'daki yaşam dengesini korumada çok daha büyük bir rol oynadığını kabul ediyor. Ormanlar bölgesel iklimi düzenler, büyük miktarda karbon depolar, biyolojik çeşitliliği korur ve kıtalar boyunca yağış düzenlerini etkiler. Son araştırmalar ayrıca ağaçların yer altındaki mantar ağları aracılığıyla birbirleriyle iletişim kurduğunu, besin alışverişi yaptığını ve çevresel tehlikeler konusunda komşu bitkileri uyardığını göstermektedir." },
  { id: 12, level: "B2", language: "German", type: "Magazine", title: "Kreativität", text: "Viele Menschen glauben, Kreativität sei eine angeborene Fähigkeit, die nur wenigen besonderen Personen zur Verfügung steht. Psychologische Studien zeigen jedoch, dass kreatives Denken vor allem durch Übung, Neugier und die Bereitschaft entsteht, Fehler zu akzeptieren. Wer regelmäßig neue Erfahrungen sammelt, Bücher liest oder mit Menschen unterschiedlicher Hintergründe spricht, entwickelt häufig originellere Ideen. Gleichzeitig kann eine Arbeitsumgebung, die Experimente erlaubt und Misserfolge nicht sofort bestraft, Innovation erheblich fördern.", expected: "Birçok insan yaratıcılığın yalnızca bazı özel insanlarda bulunan doğuştan gelen bir yetenek olduğuna inanır. Ancak psikolojik araştırmalar, yaratıcı düşüncenin büyük ölçüde pratik yapma, merak duygusu ve hata yapmayı kabul etme isteğiyle geliştiğini göstermektedir. Düzenli olarak yeni deneyimler yaşayan, kitap okuyan veya farklı geçmişlere sahip insanlarla konuşan kişiler genellikle daha özgün fikirler üretir. Aynı zamanda denemelere izin veren ve başarısızlığı hemen cezalandırmayan bir çalışma ortamı yenilikçiliği önemli ölçüde destekleyebilir." },
  { id: 13, level: "C1", language: "Turkish", type: "Literary Essay", title: "Zamanın Katmanları", text: "İnsan, çoğu zaman hayatını büyük kararların şekillendirdiğini düşünür. Oysa geriye dönüp bakıldığında, yönümüzü değiştiren asıl anların sessiz ve sıradan olduğu fark edilir. Bir gün rastgele girilen bir kitapçı, beklenmedik bir sohbet ya da hiç planlanmamış kısa bir yolculuk, yıllar sonra hayatın dönüm noktası olarak hatırlanabilir. Çünkü insan yalnızca aldığı kararlarla değil, karşılaştığı insanlar ve yaşadığı deneyimlerle de değişir. Bu nedenle geleceği bütünüyle planlama çabası çoğu zaman yanıltıcıdır.", expected: "People often believe that their lives are shaped by major decisions. Yet, when looking back, it becomes clear that the moments which truly changed our direction were often quiet and ordinary. A visit to a bookstore made on impulse, an unexpected conversation, or an unplanned journey may later be remembered as a turning point. Human beings are transformed not only by the choices they make but also by the people they meet and the experiences they share. For this reason, attempting to plan the future in every detail can be misleading." },
  { id: 14, level: "C1", language: "English", type: "Academic Essay", title: "Digital Democracy", text: "The widespread availability of digital technology has transformed the way knowledge is created, distributed, and consumed. While this transformation has democratized access to information, it has also introduced significant challenges regarding reliability and critical evaluation. Modern readers are confronted with an overwhelming quantity of articles, videos, and social media posts, many of which prioritize speed and emotional impact over factual accuracy. Consequently, digital literacy has become an essential competence rather than an optional skill.", expected: "Dijital teknolojilerin yaygınlaşması, bilginin üretilme, paylaşılma ve tüketilme biçimini köklü şekilde değiştirmiştir. Bu dönüşüm bilgiye erişimi demokratikleştirirken, güvenilirlik ve eleştirel değerlendirme açısından önemli sorunları da beraberinde getirmiştir. Günümüz insanı, doğruluktan çok hız ve duygusal etkiyi ön planda tutan sayısız makale, video ve sosyal medya paylaşımıyla karşı karşıyadır. Bu nedenle dijital okuryazarlık artık isteğe bağlı bir beceri değil, temel bir yeterlilik hâline gelmiştir." },
  { id: 15, level: "C1", language: "German", type: "Philosophy", title: "Wahrer Fortschritt", text: "Fortschritt wird häufig anhand technischer Innovationen oder wirtschaftlicher Kennzahlen gemessen. Doch eine Gesellschaft kann materiell wohlhabend sein und dennoch an sozialem Zusammenhalt verlieren. Wirklicher Fortschritt zeigt sich nicht allein in neuen Erfindungen, sondern ebenso in der Fähigkeit, Verantwortung füreinander zu übernehmen und unterschiedliche Perspektiven respektvoll miteinander zu verbinden. Bildung, Kultur und Wissenschaft schaffen Räume, in denen Menschen lernen, komplexe Probleme gemeinsam zu lösen, anstatt einfache Antworten zu akzeptieren.", expected: "İlerleme çoğu zaman teknolojik yenilikler veya ekonomik göstergelerle ölçülür. Ancak bir toplum maddi açıdan zengin olsa bile sosyal dayanışmasını kaybedebilir. Gerçek ilerleme yalnızca yeni icatlarla değil, insanların birbirlerine karşı sorumluluk üstlenebilmesi ve farklı bakış açılarını saygıyla bir araya getirebilmesiyle de ölçülür. Eğitim, kültür ve bilim; insanların karmaşık sorunlara kolay cevaplar aramak yerine birlikte çözüm üretmeyi öğrendiği alanlar oluşturur." },
  { id: 16, level: "C2", language: "Turkish", type: "Novel Excerpt", title: "Hafıza ve Kurgu", text: "Zaman, insan zihninde çizgisel bir akış gibi görünse de aslında anıların üst üste bindiği, geçişken bir katmanlar bütünüdür. Eskimiş bir ahşap evin gıcırdayan zemininde yürürken, sadece fiziksel bir mekânda değil, yaşanmışlıkların tortusunda geziniyordum. Duvarlara sinmiş o rutubetli koku, sadece bir geçmiş zaman belirtisi değil, artık orada olmayanlara dair bir sessizlik manifestosuydu. İnsan, kendine ait bir hikâyeyi inşa ederken çoğu zaman gerçekleri değil, kendi inandığı kurguyu seçer; zira çıplak gerçeklik, insanın ruhuna ağır gelen bir yüktür.", expected: "Time, though it may appear as a linear flow in the human mind, is actually a permeable collection of layers where memories overlap. Walking on the creaking floorboards of an old wooden house, I was navigating not just a physical space, but the sediment of lived experiences. The damp scent permeating the walls was not merely a sign of the past; it was a manifesto of silence regarding those no longer there. In constructing their own narratives, people often choose not the truth, but the fiction they believe in, for naked reality is a burden too heavy for the human spirit." },
  { id: 17, level: "C2", language: "English", type: "Philosophical Essay", title: "Modernity's Paradox", text: "The paradox of modernity lies in our unprecedented connectivity coupled with an intensifying sense of profound isolation. We possess the technological apparatus to bridge vast geographical divides instantaneously, yet we often find ourselves incapable of genuine, unmediated engagement. Perhaps the danger of our digital age is not merely the erosion of privacy, but the atrophy of contemplative silence. In a world characterized by the relentless pursuit of immediacy and perpetual distraction, the capacity for deep, sustained focus becomes a radical act of resistance.", expected: "Modernitenin paradoksu, eşi benzeri görülmemiş bir bağlantısallıkla birlikte derinleşen bir yalnızlık duygusunda yatmaktadır. Coğrafi mesafeleri anında aşacak teknolojik donanıma sahiiz, ancak çoğu zaman aracısız ve samimi bir iletişim kurmaktan aciziz. Belki de dijital çağımızın tehlikesi sadece mahremiyetin erozyonu değil, tefekkürün getirdiği sessizliğin körelmesidir. Sürekli bir aciliyet arayışı ve bitmek bilmeyen dikkat dağınıklığıyla karakterize edilen bu dünyada, derin ve sürdürülebilir odaklanma yetisi radikal bir direniş eylemine dönüşmektedir." },
  { id: 18, level: "C2", language: "German", type: "Poetic Prose", title: "Alacakaranlık", text: "Wenn die Dämmerung das Licht verschlingt und die Schatten länger werden, beginnt die Welt der verborgenen Bedeutungen. In der Stille des Abends, wenn der Lärm des Tages in eine ferne Erinnerung übergeht, wird die Sprache selbst zu einem flüchtigen Element. Die Wörter, die wir tagsüber wie Münzen gehandelt haben, verlieren ihre feste Form und lösen sich in Sehnsucht und Ahnung auf. Es ist eine Welt, die sich dem messbaren Verstand entzieht; eine Welt, in der das Ungesagte eine größere Schwere besitzt als das laut Ausgesprochene.", expected: "Alacakaranlık ışığı yuttuğunda ve gölgeler uzadığında, gizli anlamlar dünyası başlar. Akşamın sessizliğinde, günün gürültüsü uzak bir hatıraya dönüştüğünde, dilin kendisi uçucu bir öğeye dönüşür. Gündüzleri madeni paralar gibi harcadığımız kelimeler, katı formlarını kaybeder; yerini özleme ve sezişe bırakır. Bu, ölçülebilir aklın kavrayamadığı bir dünyadır; söylenmemiş olanın, yüksek sesle söylenenden daha fazla ağırlığa sahip olduğu bir evren." }
];

const SEVIYE_BILGILERI: Record<string, string> = {
  A1: "Giriş Seviyesi: Temel zamanlar.",
  A2: "Temel Seviye: Geçmiş zaman ve bağlaçlar.",
  B1: "Orta Seviye: Betimleme becerileri.",
  B2: "Üst-Orta: Eleştirel düşünme.",
  C1: "İleri Seviye: Soyut analiz.",
  C2: "Ustalık: Edebî üslup."
};

export default function App() {
  const { publicKey } = useFreighter();
  const [selectedLevel, setSelectedLevel] = useState("A1");
  const [sourceLang, setSourceLang] = useState("English");
  const [targetLang, setTargetLang] = useState("Turkish");
  const [translation, setTranslation] = useState("");
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [txHash, setTxHash] = useState("");
  const [score, setScore] = useState(0);

  const activeText = useMemo(() => {
    return metinKutuphanesi.find(m => m.level === selectedLevel && m.language === sourceLang) || metinKutuphanesi[0];
  }, [selectedLevel, sourceLang]);

const handleSubmit = async () => {
    setStatus('loading');
    
    const userWords = translation.trim().split(/\s+/).filter(w => w.length > 0);
    const originalWords = (activeText as any).expected?.split(/\s+/).filter((w: string) => w.length > 0) || [];
    
    // AKADEMİK PUANLAMA MANTIĞI
    let calculatedScore = 0;
    if (userWords.length === 0 || userWords.length < (originalWords.length * 0.3)) {
      calculatedScore = 0; // Çok kısa çeviriler akademik olarak geçersizdir
    } else {
      let matchCount = 0;
      userWords.forEach((word, index) => {
        if (originalWords[index] && word.toLowerCase() === originalWords[index].toLowerCase()) {
          matchCount++;
        }
      });
      // Oranlama
      calculatedScore = Math.round((matchCount / originalWords.length) * 100);
    }
    setScore(calculatedScore);

   // App.tsx içindeki handleSubmit fonksiyonunun try bloğu içini şu şekilde güncelle:
// 74. satırdan itibaren burayı yapıştır:
    try {
      const result = await registerTranslationOnChain(translation);
      setTxHash(result.hash);
      setStatus('success');
    } catch (e) {
      console.error("Blockchain işlemi başarısız:", e);
      setStatus('idle');
      alert("İşlem blockchain'e gönderilemedi. Lütfen cüzdanı kontrol et.");
    }
  };

  return (
    <div style={{ maxWidth: "62rem", margin: "0 auto", padding: "4rem 2rem" }}>
      <h1>LinguaChain</h1>
      {status !== 'success' ? (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
          <div>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
              <select onChange={(e) => setSelectedLevel(e.target.value)} value={selectedLevel}>
                {["A1", "A2", "B1", "B2", "C1", "C2"].map(l => <option key={l}>{l}</option>)}
              </select>
              <select onChange={(e) => setSourceLang(e.target.value)} value={sourceLang}>
                {["English", "Turkish", "German"].map(l => <option key={l}>{l}</option>)}
              </select>
              <select onChange={(e) => setTargetLang(e.target.value)} value={targetLang}>
                {["English", "Turkish", "German"].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <TranslationEditor 
              key={`${selectedLevel}-${sourceLang}`}
              sourceText={activeText.text} 
              prompt={activeText.type} 
              value={translation} 
              onChange={setTranslation} 
              onSubmit={handleSubmit}
              sourceLanguageLabel={sourceLang}
              targetLanguageLabel={targetLang}
            />
          </div>
          <div style={{ padding: "1.5rem", border: "1px solid #ddd", height: "fit-content", backgroundColor: "#fdfdfd" }}>
            <h3>Seviye Hedefi</h3>
            <p style={{ fontSize: "0.9rem" }}>{SEVIYE_BILGILERI[selectedLevel]}</p>
          </div>
        </div>
      ) : (
        <div>
          <CertificateCard 
  id={1} 
  owner={publicKey || "GUEST"} 
  score={score} 
  reference={txHash} // Burası txHash değişkenini almalı!
  issuedAt={Math.floor(Date.now() / 1000)} 
  explorerUrl={`https://stellarchain.io/tx/${txHash}`}
/>
          <button onClick={() => { setStatus('idle'); setTranslation(""); setScore(0); }}>Translate Another</button>
        </div>
      )}
    </div>
  );
}