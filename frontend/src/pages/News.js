import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import heroImage from '../assets/rental-hero.png';
import '../styles/news.css';

const articles = [
    {
        id: 'xem-phong', category: 'Kinh nghiệm thuê trọ', time: '3 phút đọc', icon: 'home',
        title: 'Lần đầu đi xem phòng: nên chuẩn bị những gì?',
        excerpt: 'Một danh sách nhỏ giúp bạn quan sát kỹ hơn và chọn không gian phù hợp với sinh hoạt hằng ngày.',
        paragraphs: [
            'Trước buổi hẹn, ghi lại những điều bạn cần: khoảng cách đi học hoặc đi làm, diện tích sử dụng, chỗ để xe và những món đồ sẽ mang theo. Chọn vài tiêu chí quan trọng nhất để dễ so sánh các phòng.',
            'Khi xem phòng, dành thời gian quan sát ánh sáng, độ thông thoáng và tiếng ồn. Thử vòi nước, kiểm tra cửa sổ, ổ cắm và hỏi vị trí phơi đồ. Nếu có thể, ghé khu vực vào thời điểm bạn thường về nhà để cảm nhận nhịp sinh hoạt.',
            'Hỏi rõ giờ giấc ra vào, cách sử dụng khu vực chung và các khoản chi phí định kỳ. Ghi lại thông tin ngay sau buổi xem phòng để so sánh, thay vì chỉ dựa vào ấn tượng đầu tiên.',
        ],
    },
    {
        id: 'sap-xep', category: 'Không gian sống', time: '2 phút đọc', icon: 'layout',
        title: 'Phòng nhỏ vẫn thoáng với cách sắp xếp đơn giản',
        excerpt: 'Tận dụng ánh sáng và chia khu vực sinh hoạt để căn phòng gọn gàng, dễ sử dụng hơn.',
        paragraphs: [
            'Đặt bàn học hoặc bàn làm việc gần nguồn sáng tự nhiên, giữ lối đi từ cửa vào phòng thông thoáng. Trước khi mua đồ, đo kích thước phòng và đánh dấu vị trí dự kiến của giường, bàn và tủ.',
            'Ưu tiên đồ có nhiều công dụng như hộp đựng dưới gầm giường hoặc bàn có ngăn kéo. Gom những vật dụng cùng nhóm vào một chỗ để việc tìm kiếm và dọn dẹp nhẹ nhàng hơn.',
            'Dùng một vài màu chủ đạo cho chăn, rèm và đồ lưu trữ để giảm cảm giác rối mắt. Giữ khoảng trống quanh cửa sổ giúp phòng nhận ánh sáng và thông gió tốt hơn.',
        ],
    },
    {
        id: 'chuyen-tro', category: 'Kinh nghiệm thuê trọ', time: '2 phút đọc', icon: 'box',
        title: 'Danh sách cần chuẩn bị trước ngày chuyển trọ',
        excerpt: 'Chia đồ theo nhóm, đóng gói vừa sức và dành riêng một túi đồ dùng cho ngày đầu tiên.',
        paragraphs: [
            'Chia đồ thành ba nhóm: mang theo, tặng lại và không còn sử dụng. Đóng gói các vật ít dùng trước, ghi tên nhóm đồ lên từng thùng để sắp xếp nhanh khi đến nơi.',
            'Chuẩn bị riêng một túi gồm quần áo, đồ vệ sinh cá nhân, bộ sạc, nước uống và vật dụng cần dùng ngay. Giữ giấy tờ cùng đồ có giá trị bên mình trong lúc di chuyển.',
            'Thống nhất trước thời gian chuyển đến, vị trí đỗ xe và cách sử dụng thang máy nếu có. Khi nhận phòng, cùng chủ trọ ghi lại tình trạng đồ dùng để hai bên dễ đối chiếu.',
        ],
    },
    {
        id: 'o-ghep', category: 'Đời sống sinh viên', time: '3 phút đọc', icon: 'people',
        title: 'Ở ghép thoải mái hơn từ những thỏa thuận nhỏ',
        excerpt: 'Trao đổi sớm về giờ giấc, việc dọn dẹp và không gian riêng để cùng sống dễ chịu hơn.',
        paragraphs: [
            'Trước khi ở chung, hãy trao đổi về lịch học, lịch làm việc và thời gian nghỉ ngơi. Những khác biệt nhỏ về thói quen sẽ dễ giải quyết hơn khi được nói rõ từ đầu.',
            'Cùng thống nhất cách chia việc nhà, đồ dùng chung và chi phí sinh hoạt. Một danh sách ngắn hoặc lịch dọn dẹp dễ nhìn giúp mọi người chủ động hơn mà không cần nhắc nhau nhiều lần.',
            'Tôn trọng đồ dùng và không gian riêng của nhau. Khi có điều chưa thoải mái, chọn thời điểm phù hợp để nói cụ thể điều bạn muốn thay đổi và lắng nghe ý kiến của người ở cùng.',
        ],
    },
];
const categories = ['Tất cả', ...new Set(articles.map((article) => article.category))];

function NewsIcon({ name }) {
    return (
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {name === 'home' && <><path d="m6 22 18-15 18 15M11 19v22h26V19" /><path d="M20 41V27h8v14M20 19h8" /></>}
            {name === 'layout' && <><rect x="7" y="7" width="34" height="34" rx="4" /><path d="M7 22h34M25 22v19M13 14h8" /></>}
            {name === 'box' && <><path d="m24 6 17 9v19l-17 9-17-9V15l17-9ZM7 15l17 9 17-9M24 24v19M15 11l18 9" /></>}
            {name === 'people' && <><circle cx="18" cy="16" r="7" /><path d="M5 40v-5a13 13 0 0 1 26 0v5M32 10a7 7 0 0 1 0 14M37 28a12 12 0 0 1 6 11" /></>}
        </svg>
    );
}

export default function News() {
    const [category, setCategory] = useState('Tất cả');
    const [search, setSearch] = useState('');
    const normalize = (value) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
    const visibleArticles = articles.filter((article) => (
        (category === 'Tất cả' || article.category === category)
        && normalize(`${article.title} ${article.excerpt}`).includes(normalize(search.trim()))
    ));

    return (
        <div className="news-page">
            <header className="news-heading">
                <p className="news-eyebrow">GÓC CHIA SẺ RENTALROOM</p>
                <h1>Tin tức &amp; cẩm nang thuê trọ</h1>
                <p>Kinh nghiệm tìm phòng, chăm chút không gian và tận hưởng cuộc sống ở trọ.</p>
            </header>

            <section className="news-feature" aria-labelledby="news-feature-title">
                <div className="news-feature-copy">
                    <span className="news-tag">Cẩm nang nổi bật</span>
                    <h2 id="news-feature-title">Một căn phòng phù hợp.<br />Một khởi đầu an tâm.</h2>
                    <p>Từ buổi xem phòng đầu tiên đến ngày chuyển vào, những chuẩn bị nhỏ sẽ giúp bạn chủ động hơn trên hành trình tìm nơi ở mới.</p>
                    <a className="news-primary-link" href="#news-articles">Khám phá cẩm nang <span aria-hidden="true">↗</span></a>
                </div>
                <div className="news-feature-image">
                    <img src={heroImage} alt="Không gian phòng trọ sáng với giường và bàn làm việc" />
                    <span>Không gian nhỏ, khởi đầu mới</span>
                </div>
            </section>

            <section id="news-articles" className="news-articles" aria-labelledby="news-articles-title">
                <div className="news-section-heading">
                    <div><p className="news-eyebrow">ĐỌC &amp; KHÁM PHÁ</p><h2 id="news-articles-title">Góc kinh nghiệm</h2></div>
                    <label className="news-search">
                        <span className="visually-hidden">Tìm bài viết</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></svg>
                        <input type="search" placeholder="Tìm bài viết..." value={search} onChange={(event) => setSearch(event.target.value)} />
                    </label>
                </div>
                <div className="news-filters" role="group" aria-label="Chủ đề bài viết">
                    {categories.map((item) => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
                </div>
                <p className="news-count" role="status">{visibleArticles.length} bài viết</p>
                <div className="news-grid">
                    {visibleArticles.map((article) => (
                        <article className="news-card" key={article.id}>
                            <div className={`news-card-art news-card-art--${article.icon}`}><NewsIcon name={article.icon} /><span>{article.category}</span></div>
                            <div className="news-card-copy">
                                <div className="news-meta"><span>{article.category}</span><span>{article.time}</span></div>
                                <h3>{article.title}</h3>
                                <p>{article.excerpt}</p>
                                <details className="news-details">
                                    <summary>Đọc bài viết <span aria-hidden="true">↗</span></summary>
                                    <div>{article.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
                                </details>
                            </div>
                        </article>
                    ))}
                </div>
                {visibleArticles.length === 0 && <div className="news-empty"><h3>Chưa tìm thấy bài viết phù hợp</h3><p>Thử từ khóa khác hoặc xem tất cả chủ đề.</p><button type="button" onClick={() => { setSearch(''); setCategory('Tất cả'); }}>Xem tất cả bài viết</button></div>}
            </section>

            <aside className="news-cta"><div><h2>Sẵn sàng tìm nơi ở mới?</h2><p>Khám phá các phòng trọ và chọn không gian phù hợp với bạn.</p></div><Link className="news-primary-link" to="/phong-tro">Tìm phòng trọ <span aria-hidden="true">→</span></Link></aside>
        </div>
    );
}
