/**
 * Seed Script — Insert 10 sample products into Supabase
 * 
 * Usage: node seed-products.mjs
 * 
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from fe/.env
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read backend .env to get service_role key (bypasses RLS)
const beEnvPath = resolve(__dirname, '..', 'be', '.env');
const beEnvContent = readFileSync(beEnvPath, 'utf-8');
const env = {};
beEnvContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_KEY; // service_role key — bypasses RLS

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in be/.env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 10 sample products with real Unsplash images
const sampleProducts = [
    {
        name: 'MacBook Pro 2021 M1 Pro',
        description: 'MacBook Pro 14 inch, chip M1 Pro, RAM 16GB, SSD 512GB. Máy còn mới 98%, pin cycle 120. Fullbox phụ kiện gốc, bảo hành Apple còn 6 tháng.',
        price: 28500000,
        category: 'Điện tử',
        condition: 'like_new',
        quantity: 1,
        status: 'available',
        location: 'TP.HCM, Quận 1',
        image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    },
    {
        name: 'Giáo trình Kinh tế học vĩ mô',
        description: 'Sách giáo trình đại học, tác giả N. Gregory Mankiw, bản dịch tiếng Việt. Sách mới, chưa ghi chú. Phù hợp cho sinh viên năm nhất ngành Kinh tế.',
        price: 85000,
        category: 'Sách vở',
        condition: 'new',
        quantity: 3,
        status: 'available',
        location: 'Hà Nội, Cầu Giấy',
        image_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
    },
    {
        name: 'Xe đạp địa hình Giant cũ',
        description: 'Xe đạp Giant ATX 830, size M. Đã sử dụng 1 năm, bảo dưỡng định kỳ. Phanh đĩa, bộ truyền động Shimano 21 tốc độ. Tặng kèm khóa xe.',
        price: 3200000,
        category: 'Xe cộ',
        condition: 'good',
        quantity: 1,
        status: 'available',
        location: 'Đà Nẵng, Hải Châu',
        image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
    },
    {
        name: 'Đèn bàn học chống cận',
        description: 'Đèn LED bàn học chống cận, 3 chế độ sáng, điều chỉnh độ sáng. Pin sạc, sử dụng được 8 tiếng liên tục. Thiết kế hiện đại, nhỏ gọn.',
        price: 150000,
        category: 'Đồ gia dụng',
        condition: 'new',
        quantity: 5,
        status: 'available',
        location: 'TP.HCM, Thủ Đức',
        image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    },
    {
        name: 'Tai nghe Sony WH-1000XM4',
        description: 'Tai nghe chống ồn cao cấp Sony WH-1000XM4, màu đen. Pin 30 giờ, Bluetooth 5.0, NFC. Còn bảo hành chính hãng. Fullbox.',
        price: 4200000,
        category: 'Điện tử',
        condition: 'like_new',
        quantity: 1,
        status: 'available',
        location: 'TP.HCM, Quận 7',
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    },
    {
        name: 'Bộ sách lập trình Python',
        description: 'Combo 3 cuốn: Python Crash Course, Automate The Boring Stuff, Fluent Python. Sách tiếng Anh, bản in mới nhất. Phù hợp tự học lập trình.',
        price: 450000,
        category: 'Sách vở',
        condition: 'new',
        quantity: 2,
        status: 'available',
        location: 'Hà Nội, Đống Đa',
        image_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80',
    },
    {
        name: 'Balo laptop chống nước 15.6"',
        description: 'Balo laptop chống nước, ngăn laptop 15.6 inch có đệm dày. Chất liệu polyester cao cấp, nhiều ngăn tiện dụng. Phù hợp sinh viên, dân văn phòng.',
        price: 320000,
        category: 'Khác',
        condition: 'new',
        quantity: 10,
        status: 'available',
        location: 'TP.HCM, Bình Thạnh',
        image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    },
    {
        name: 'Vợt cầu lông Yonex Astrox 88D',
        description: 'Vợt cầu lông chính hãng Yonex Astrox 88D, đã căng cước BG65 26lbs. Tặng kèm bao vợt và grip. Phù hợp người chơi trung cấp.',
        price: 1800000,
        category: 'Thể thao',
        condition: 'good',
        quantity: 1,
        status: 'available',
        location: 'Đà Nẵng, Thanh Khê',
        image_url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
    },
    {
        name: 'Áo khoác hoodie oversize unisex',
        description: 'Áo hoodie oversize chất cotton french terry 100%, dày dặn, mặc ấm. Size M/L/XL. Màu đen, có mũ và túi kangaroo. Thích hợp mùa lạnh.',
        price: 195000,
        category: 'Quần áo',
        condition: 'new',
        quantity: 20,
        status: 'available',
        location: 'Hà Nội, Hoàn Kiếm',
        image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80',
    },
    {
        name: 'iPad Air 5 M1 WiFi 64GB',
        description: 'iPad Air 5 chip M1, màn hình 10.9 inch Liquid Retina. Hỗ trợ Apple Pencil 2 và Magic Keyboard. Máy còn mới 99%, chưa active Apple Care.',
        price: 11500000,
        category: 'Điện tử',
        condition: 'like_new',
        quantity: 1,
        status: 'available',
        location: 'TP.HCM, Quận 3',
        image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
    },
];

async function seed() {
    console.log('🌱 Inserting 10 sample products into Supabase...\n');

    const { data, error } = await supabase
        .from('products')
        .insert(sampleProducts)
        .select();

    if (error) {
        console.error('❌ Error inserting products:', error.message);
        console.error('   Details:', error.details || error.hint || '');
        
        // Try one by one to identify issues
        console.log('\n🔄 Trying to insert products one by one...\n');
        for (const product of sampleProducts) {
            const { data: d, error: e } = await supabase
                .from('products')
                .insert(product)
                .select();
            
            if (e) {
                console.error(`   ❌ Failed: ${product.name} — ${e.message}`);
            } else {
                console.log(`   ✅ Inserted: ${product.name}`);
            }
        }
    } else {
        console.log(`✅ Successfully inserted ${data.length} products!\n`);
        data.forEach(p => {
            console.log(`   📦 ${p.name} — ${p.price.toLocaleString('vi-VN')}đ`);
        });
    }

    console.log('\n🎉 Seed complete!');
}

seed().catch(console.error);
