// myvkard-backend/controller/redirectController.js
const User = require('../models/User');

exports.showActiveCompanyProfile = async (req, res) => {
  try {
    const { uniqueId } = req.params;
    const user = await User.findOne({ uniqueId });
    
    if (!user) {
      return res.status(404).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h2>User not found</h2>
          </body>
        </html>
      `);
    }
    
    if (user.nfcCardCount <= 0) {
      return res.status(403).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h2>Please purchase an NFC card first</h2>
          </body>
        </html>
      `);
    }
    
    const activeProfile = user.companyProfiles.find(p => p.isActive);
    
    if (!activeProfile) {
      return res.status(404).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h2>No active company profile set</h2>
          </body>
        </html>
      `);
    }
    
    // Return the mobile-optimized company card view as HTML
    const cardHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${activeProfile.companyName} - Digital Business Card</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f5f5;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .business-card {
            width: 100%;
            max-width: 400px;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            position: relative;
        }
        
        .card-header {
            background: linear-gradient(135deg, #3b4d7a 0%, #2d3a5f 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
            position: relative;
        }
        
        .profile-avatar {
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 28px;
            font-weight: bold;
            color: white;
            overflow: hidden;
        }
        
        .profile-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
            line-height: 1.2;
        }
        
        .company-title {
            font-size: 16px;
            opacity: 0.9;
            margin-bottom: 4px;
            font-weight: 500;
        }
        
        .company-subtitle {
            font-size: 14px;
            opacity: 0.8;
            font-weight: 400;
        }
        
        .card-content {
            padding: 30px;
            background: white;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 20px;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
            padding: 12px 0;
        }
        
        .contact-icon {
            width: 24px;
            height: 24px;
            margin-right: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #3b4d7a;
            font-size: 16px;
        }
        
        .contact-text {
            flex: 1;
            font-size: 15px;
            color: #333;
            line-height: 1.4;
            word-break: break-word;
        }
        
        .contact-text a {
            color: #3b4d7a;
            text-decoration: none;
        }
        
        .contact-text a:hover {
            text-decoration: underline;
        }
        
        .about-section {
            margin-top: 30px;
        }
        
        .about-text {
            font-size: 14px;
            line-height: 1.6;
            color: #555;
            margin-bottom: 20px;
        }
        
        .services-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 30px;
        }
        
        .service-tag {
            background: #f0f2f5;
            color: #3b4d7a;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .action-buttons {
            display: flex;
            gap: 12px;
            margin-top: 30px;
        }
        
        .action-btn {
            flex: 1;
            border: none;
            padding: 14px 20px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .btn-primary {
            background: #3b4d7a;
            color: white;
        }
        
        .btn-primary:hover {
            background: #2d3a5f;
            transform: translateY(-1px);
        }
        
        .btn-success {
            background: #10b981;
            color: white;
        }
        
        .btn-success:hover {
            background: #059669;
            transform: translateY(-1px);
        }
        
        .btn-outline {
            background: transparent;
            color: #666;
            border: 2px solid #e5e5e5;
        }
        
        .btn-outline:hover {
            background: #f8f8f8;
            border-color: #d0d0d0;
        }
        
        .social-section {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #f0f0f0;
        }
        
        .social-links {
            display: flex;
            gap: 12px;
        }
        
        .social-link {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            color: white;
            font-size: 16px;
            transition: transform 0.3s ease;
        }
        
        .social-link:hover {
            transform: scale(1.1);
        }
        
        .social-linkedin { background: #0077b5; }
        .social-facebook { background: #1877f2; }
        .social-instagram { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); }
        .social-twitter { background: #1da1f2; }
        .social-youtube { background: #ff0000; }
        
        .qr-code-section {
            text-align: center;
        }
        
        .qr-code {
            width: 80px;
            height: 80px;
            background: #f8f8f8;
            border: 2px solid #e5e5e5;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #999;
            font-weight: bold;
            margin: 0 auto;
        }
        
        .qr-text {
            font-size: 11px;
            color: #666;
            margin-top: 8px;
        }
        
        /* Mobile responsiveness */
        @media (max-width: 480px) {
            body {
                padding: 10px;
            }
            
            .business-card {
                max-width: 100%;
            }
            
            .card-header {
                padding: 30px 20px;
            }
            
            .card-content {
                padding: 20px;
            }
            
            .company-name {
                font-size: 20px;
            }
            
            .action-buttons {
                flex-direction: column;
            }
        }
        
        /* Tablet styles */
        @media (min-width: 768px) {
            .business-card {
                max-width: 450px;
            }
        }
    </style>
</head>
<body>
    <div class="business-card">
        <!-- Header Section -->
        <div class="card-header">
            <div class="profile-avatar">
                ${activeProfile.logo ? 
                  `<img src="${activeProfile.logo}" alt="${activeProfile.companyName} Logo">` : 
                  `${activeProfile.companyName.charAt(0)}${activeProfile.companyName.split(' ')[1] ? activeProfile.companyName.split(' ')[1].charAt(0) : ''}`
                }
            </div>
            <div class="company-name">${activeProfile.companyName}</div>
            <div class="company-title">${activeProfile.industry || 'Business Services'}</div>
            <div class="company-subtitle">${activeProfile.tagline || activeProfile.companyName}</div>
        </div>
        
        <!-- Content Section -->
        <div class="card-content">
            <!-- Contact Information -->
            <div class="section-title">Contact Information</div>
            
            <div class="contact-item">
                <div class="contact-icon">📞</div>
                <div class="contact-text">
                    <a href="tel:${activeProfile.companyPhone}">${activeProfile.companyPhone}</a>
                </div>
            </div>
            
            <div class="contact-item">
                <div class="contact-icon">✉️</div>
                <div class="contact-text">
                    <a href="mailto:${activeProfile.companyEmail}">${activeProfile.companyEmail}</a>
                </div>
            </div>
            
            ${activeProfile.website ? `
            <div class="contact-item">
                <div class="contact-icon">🌐</div>
                <div class="contact-text">
                    <a href="${activeProfile.website}" target="_blank">${activeProfile.website}</a>
                </div>
            </div>
            ` : ''}
            
            <div class="contact-item">
                <div class="contact-icon">📍</div>
                <div class="contact-text">${activeProfile.companyLocation}</div>
            </div>
            
            <!-- About Section -->
            ${activeProfile.description ? `
            <div class="about-section">
                <div class="section-title">About Our Practice</div>
                <div class="about-text">${activeProfile.description}</div>
            </div>
            ` : `
            <div class="about-section">
                <div class="section-title">About Our Practice</div>
                <div class="about-text">
                    ${activeProfile.companyName} provides comprehensive business advisory services to established enterprises and emerging companies. We specialize in strategic planning, operational excellence, and sustainable growth solutions.
                </div>
            </div>
            `}
            
            <!-- Services Tags -->
            <div class="section-title">Key Services</div>
            <div class="services-tags">
                <span class="service-tag">Strategic Planning</span>
                <span class="service-tag">Business Development</span>
                <span class="service-tag">Operational Consulting</span>
                <span class="service-tag">Digital Transformation</span>
            </div>
            
            <!-- Action Buttons -->
            <div class="action-buttons">
                <button class="action-btn btn-primary" onclick="callNow()">
                    📞 Call Now
                </button>
                <button class="action-btn btn-outline" onclick="saveContact()">
                    💾 Save Contact
                </button>
            </div>
            
            <!-- Social Links and QR Code -->
            <div class="social-section">
                <div class="social-links">
                    ${activeProfile.linkedin ? `<a href="${activeProfile.linkedin}" class="social-link social-linkedin" target="_blank">💼</a>` : ''}
                    ${activeProfile.facebook ? `<a href="${activeProfile.facebook}" class="social-link social-facebook" target="_blank">📘</a>` : ''}
                    ${activeProfile.instagram ? `<a href="${activeProfile.instagram}" class="social-link social-instagram" target="_blank">📷</a>` : ''}
                    ${activeProfile.twitterX ? `<a href="${activeProfile.twitterX}" class="social-link social-twitter" target="_blank">🐦</a>` : ''}
                    ${activeProfile.youtube ? `<a href="${activeProfile.youtube}" class="social-link social-youtube" target="_blank">📺</a>` : ''}
                </div>
                
                <div class="qr-code-section">
                    <div class="qr-code">QR</div>
                    <div class="qr-text">Scan Card</div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        function callNow() {
            window.location.href = 'tel:${activeProfile.companyPhone}';
        }
        
        function openWhatsApp() {
            const message = encodeURIComponent(\`Hello, I found your business card for \${activeProfile.companyName}. I'd like to know more about your services.\`);
            const phoneNumber = '${activeProfile.companyPhone}'.replace(/[^0-9]/g, '');
            window.open(\`https://wa.me/\${phoneNumber}?text=\${message}\`, '_blank');
        }
        
        function saveContact() {
            const company = {
                name: "${activeProfile.companyName}",
                email: "${activeProfile.companyEmail}",
                phone: "${activeProfile.companyPhone}",
                location: "${activeProfile.companyLocation}",
                website: "${activeProfile.website || ''}",
                industry: "${activeProfile.industry || ''}",
                linkedin: "${activeProfile.linkedin || ''}",
                facebook: "${activeProfile.facebook || ''}",
                instagram: "${activeProfile.instagram || ''}",
                twitter: "${activeProfile.twitterX || ''}",
                youtube: "${activeProfile.youtube || ''}"
            };
            
            // Create vCard format for company
            const vcard = \`BEGIN:VCARD
VERSION:3.0
FN:\${company.name}
ORG:\${company.name}
EMAIL:\${company.email}
TEL:\${company.phone}
ADR:;;\${company.location};;;
\${company.website ? 'URL:' + company.website : ''}
\${company.linkedin ? 'URL:' + company.linkedin : ''}
NOTE:Industry: \${company.industry}
END:VCARD\`;
            
            const blob = new Blob([vcard], { type: 'text/vcard' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`\${company.name}.vcf\`;
            a.click();
            window.URL.revokeObjectURL(url);
        }
        
        function shareCompany() {
            if (navigator.share) {
                navigator.share({
                    title: "${activeProfile.companyName}",
                    text: "Company profile for ${activeProfile.companyName}",
                    url: window.location.href
                });
            } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Company profile URL copied to clipboard!');
            }
        }
    </script>
</body>
</html>
    `;
    
    res.send(cardHtml);
  } catch (error) {
    console.error('Show Active Company Profile Error:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h2>Something went wrong</h2>
        </body>
      </html>
    `);
  }
};