// myvkard-backend/controller/redirectController.js
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
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 16px;
        }
        
        .card {
            width: 100%;
            max-width: 360px;
            background: linear-gradient(135deg, #004672 0%, #002b4a 100%);
            border-radius: 20px;
            padding: 24px;
            color: white;
            position: relative;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            overflow: hidden;
            margin-bottom: 20px;
        }
        
        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                90deg,
                transparent,
                rgba(255,255,255,0.1),
                transparent
            );
            animation: shimmer 3s infinite;
        }
        
        @keyframes shimmer {
            0% { left: -100%; }
            50% { left: 100%; }
            100% { left: 100%; }
        }
        
        .card-header {
            text-align: center;
            margin-bottom: 24px;
        }
        
        .company-logo {
            width: 80px;
            height: 80px;
            background: rgba(255,255,255,0.15);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            overflow: hidden;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255,255,255,0.2);
        }
        
        .company-logo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .company-logo-text {
            color: #fbbf24;
            font-weight: bold;
            font-size: 32px;
        }
        
        .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
            line-height: 1.2;
        }
        
        .company-industry {
            color: #fbbf24;
            font-size: 16px;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .qr-section {
            display: flex;
            justify-content: center;
            margin-bottom: 24px;
        }
        
        .qr-code {
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: #333;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .company-info {
            margin-bottom: 24px;
        }
        
        .info-item {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            padding: 12px;
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        }
        
        .info-item:hover {
            background: rgba(255,255,255,0.15);
            transform: translateY(-2px);
        }
        
        .info-icon {
            width: 24px;
            height: 24px;
            margin-right: 12px;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fbbf24;
        }
        
        .info-text {
            flex: 1;
            font-size: 14px;
            line-height: 1.4;
            word-break: break-all;
        }
        
        .social-links {
            display: flex;
            justify-content: center;
            gap: 12px;
            margin-bottom: 24px;
            flex-wrap: wrap;
        }
        
        .social-link {
            width: 48px;
            height: 48px;
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            color: #fbbf24;
            text-decoration: none;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
        }
        
        .social-link:hover {
            background: #fbbf24;
            color: #004672;
            transform: translateY(-4px) scale(1.1);
        }
        
        .save-contact-btn {
            width: 100%;
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            color: #000;
            border: none;
            padding: 16px;
            border-radius: 16px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .save-contact-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(251, 191, 36, 0.4);
        }
        
        .nfc-chip {
            position: absolute;
            bottom: 20px;
            right: 20px;
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: pulse 2s infinite;
            box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
        }
        
        .nfc-chip::after {
            content: '';
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 0.8; transform: scale(0.9); }
            50% { opacity: 1; transform: scale(1.1); }
        }
        
        .actions {
            width: 100%;
            max-width: 360px;
            display: flex;
            gap: 12px;
        }
        
        .action-btn {
            flex: 1;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            border: none;
            padding: 16px 20px;
            border-radius: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 14px;
        }
        
        .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
        }
        
        .action-btn.share {
            background: linear-gradient(135deg, #6366f1, #4f46e5);
        }
        
        .action-btn.share:hover {
            box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
        }
        
        /* Tablet styles */
        @media (min-width: 768px) {
            body {
                padding: 32px;
            }
            
            .card {
                max-width: 420px;
                padding: 32px;
            }
            
            .company-logo {
                width: 100px;
                height: 100px;
            }
            
            .company-name {
                font-size: 28px;
            }
            
            .company-industry {
                font-size: 18px;
            }
            
            .qr-code {
                width: 100px;
                height: 100px;
            }
            
            .info-text {
                font-size: 16px;
            }
            
            .actions {
                max-width: 420px;
            }
        }
        
        /* Desktop styles */
        @media (min-width: 1024px) {
            .card {
                max-width: 500px;
                padding: 40px;
            }
            
            .company-logo {
                width: 120px;
                height: 120px;
            }
            
            .company-name {
                font-size: 32px;
            }
            
            .company-industry {
                font-size: 20px;
            }
            
            .actions {
                max-width: 500px;
            }
        }
        
        /* Animation for card entrance */
        .card {
            animation: cardEntrance 0.8s ease-out;
        }
        
        @keyframes cardEntrance {
            0% {
                opacity: 0;
                transform: translateY(50px) scale(0.9);
            }
            100% {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        .actions {
            animation: actionsEntrance 1s ease-out 0.3s both;
        }
        
        @keyframes actionsEntrance {
            0% {
                opacity: 0;
                transform: translateY(30px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="card-header">
            <div class="company-logo">
                ${activeProfile.logo ? 
                  `<img src="${activeProfile.logo}" alt="${activeProfile.companyName} Logo">` : 
                  `<span class="company-logo-text">${activeProfile.companyName.charAt(0)}</span>`
                }
            </div>
            <div class="company-name">${activeProfile.companyName}</div>
            <div class="company-industry">${activeProfile.industry || 'Business'}</div>
        </div>
        
        <div class="qr-section">
            <div class="qr-code">
                QR CODE
            </div>
        </div>
        
        <div class="company-info">
            <div class="info-item">
                <div class="info-icon">✉️</div>
                <div class="info-text">${activeProfile.companyEmail}</div>
            </div>
            <div class="info-item">
                <div class="info-icon">📞</div>
                <div class="info-text">${activeProfile.companyPhone}</div>
            </div>
            <div class="info-item">
                <div class="info-icon">📍</div>
                <div class="info-text">${activeProfile.companyLocation}</div>
            </div>
            ${activeProfile.website ? `
            <div class="info-item">
                <div class="info-icon">🌐</div>
                <div class="info-text">${activeProfile.website}</div>
            </div>
            ` : ''}
        </div>
        
        ${(activeProfile.linkedin || activeProfile.facebook || activeProfile.instagram || 
           activeProfile.twitterX || activeProfile.youtube) ? `
        <div class="social-links">
            ${activeProfile.linkedin ? `<a href="${activeProfile.linkedin}" class="social-link" target="_blank">💼</a>` : ''}
            ${activeProfile.facebook ? `<a href="${activeProfile.facebook}" class="social-link" target="_blank">📘</a>` : ''}
            ${activeProfile.instagram ? `<a href="${activeProfile.instagram}" class="social-link" target="_blank">📷</a>` : ''}
            ${activeProfile.twitterX ? `<a href="${activeProfile.twitterX}" class="social-link" target="_blank">🐦</a>` : ''}
            ${activeProfile.youtube ? `<a href="${activeProfile.youtube}" class="social-link" target="_blank">📺</a>` : ''}
        </div>
        ` : ''}
        
        <button class="save-contact-btn" onclick="saveCompanyContact()">
            💾 Save Contact
        </button>
        
        <div class="nfc-chip"></div>
    </div>
    
    <div class="actions">
        <button class="action-btn" onclick="saveCompanyContact()">
            💾 Save Company
        </button>
        <button class="action-btn share" onclick="shareCompany()">
            📤 Share
        </button>
    </div>
    
    <script>
        function saveCompanyContact() {
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