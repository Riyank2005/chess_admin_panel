# 🚀 Production Deployment Checklist

## Pre-Deployment

### Environment Configuration
- [ ] Create production `.env` file
- [ ] Set `NODE_ENV=production`
- [ ] Update `MONGODB_URI` to production database
- [ ] Generate secure `JWT_SECRET`  (use: `openssl rand -hex 64`)
- [ ] Set production `FRONTEND_URL`
- [ ] Configure email service credentials (if using)
- [ ] Set `LOG_LEVEL=info` or `warn`

### Security Updates
- [ ] Update CORS allowed origins in `backend/server.js`
  ```javascript
  const allowedOrigins = [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ];
  ```

- [ ] Review and adjust rate limits if needed
- [ ] Ensure all secrets are in environment variables (not hardcoded)
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Configure security headers for production domain

### Database
- [ ] Set up production MongoDB instance
- [ ] Create database backups strategy
- [ ] Set up automated backup schedule
- [ ] Test database connection from server
- [ ] Create indexes for performance
- [ ] Set up database monitoring

### Code Preparation
- [ ] Remove all `console.log()` debug statements (or leave only critical ones)
- [ ] Build production bundle: `npm run build`
- [ ] Test production build locally
- [ ] Run linters: `npm run lint`
- [ ] Check for security vulnerabilities: `npm audit`
- [ ] Update dependencies if needed: `npm update`

---

## Server Setup

### Infrastructure
- [ ] Provision server (VPS, AWS EC2, DigitalOcean, etc.)
- [ ] Install Node.js (LTS version)
- [ ] Install MongoDB (or use MongoDB Atlas)
- [ ] Set up reverse proxy (Nginx or Apache)
- [ ] Configure SSL certificate (Let's Encrypt)
- [ ] Set up CDN for static assets (optional)
- [ ] Configure DNS records

### Process Management
- [ ] Install PM2: `npm install -g pm2`
- [ ] Create PM2 ecosystem file
- [ ] Configure PM2 to start on boot
- [ ] Set up log rotation with PM2

Example PM2 ecosystem.config.js:
```javascript
module.exports = {
  apps: [{
    name: 'chess-admin-api',
    script: './backend/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './backend/logs/pm2-error.log',
    out_file: './backend/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G'
  }]
};
```

### Nginx Configuration Example
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Deployment Steps

### 1. Upload Code
```bash
# Clone repository on server
git clone your-repo-url
cd chess-master-control

# Or upload via SCP/SFTP
scp -r ./dist user@server:/var/www/chess-admin
```

### 2. Install Dependencies
```bash
npm install --production --legacy-peer-deps
```

### 3. Build Frontend
```bash
npm run build
```

### 4. Configure Environment
```bash
# Create .env file
nano backend/.env
# Add all production environment variables
```

### 5. Start Services
```bash
# Using PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/chess-admin
# Add configuration above
sudo ln -s /etc/nginx/sites-available/chess-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Set Up SSL
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
sudo systemctl restart nginx
```

---

## Post-Deployment

### Testing
- [ ] Test frontend loads: `https://yourdomain.com`
- [ ] Test API health: `https://yourdomain.com/api/ping`
- [ ] Test WebSocket connection
- [ ] Test user registration/login
- [ ] Test admin functions
- [ ] Test on mobile devices
- [ ] Test rate limiting
- [ ] Test error handling

### Monitoring Setup
- [ ] Set up application monitoring (PM2 monitoring, New Relic, Datadog, etc.)
- [ ] Configure error tracking (Sentry, Rollbar, etc.)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Configure server monitoring (CPU, RAM, disk space)
- [ ] Set up log aggregation (ELK Stack, Papertrail, etc.)
- [ ] Create alerting rules for critical issues

### Security Hardening
- [ ] Set up firewall (UFW, iptables)
- [ ] Disable root SSH login
- [ ] Set up fail2ban for brute force protection
- [ ] Configure automated security updates
- [ ] Run security audit: `npm audit`
- [ ] Scan for vulnerabilities
- [ ] Set up WAF (Web Application Firewall) - optional

### Performance Optimization
- [ ] Enable Nginx gzip compression
- [ ] Set up caching headers
- [ ] Configure CDN (Cloudflare, AWS CloudFront)
- [ ] Optimize images
- [ ] Enable HTTP/2
- [ ] Set up Redis for session storage
- [ ] Configure database connection pooling

### Backup & Recovery
- [ ] Set up automated database backups
- [ ] Test backup restoration
- [ ] Document recovery procedures
- [ ] Set up code repository backups
- [ ] Create disaster recovery plan

---

## Maintenance

### Daily
- [ ] Check error logs
- [ ] Monitor server resources
- [ ] Review security alerts

### Weekly
- [ ] Review application logs
- [ ] Check backup integrity
- [ ] Review performance metrics
- [ ] Update dependencies (if needed)

### Monthly
- [ ] Full security audit
- [ ] Performance review
- [ ] Capacity planning
- [ ] Update documentation

---

## Rollback Plan

### If Deployment Fails

1. **Database Rollback**:
   ```bash
   mongorestore --uri="mongodb://..." /path/to/backup
   ```

2. **Code Rollback**:
   ```bash
   git checkout previous-stable-tag
   npm install --production
   pm2 restart all
   ```

3. **Quick Fix**:
   ```bash
   pm2 logs  # Check logs
   pm2 restart all  # Restart app
   ```

---

## Troubleshooting

### Common Issues

**App won't start**:
- Check logs: `pm2 logs`
- Verify env variables: `pm2 env 0`
- Check port availability: `sudo lsof -i :5000`

**Database connection fails**:
- Test connection: `mongosh "mongodb://..."`
- Check firewall rules
- Verify credentials

**WebSocket not working**:
- Check Nginx WebSocket proxy configuration
- Verify firewall allows WebSocket
- Check SSL certificate

**High memory usage**:
- Check for memory leaks
- Increase PM2 max_memory_restart
- Optimize queries

---

## Contact & Support

### Emergency Contacts
- DevOps Lead: [contact]
- Database Admin: [contact]
- Security Team: [contact]

### Resources
- [Server Access]: [details]
- [Database Access]: [details]
- [Monitoring Dashboard]: [URL]
- [Error Tracking]: [URL]

---

## Sign-Off

- [ ] Development Team Lead
- [ ] QA Team
- [ ] Security Team
- [ ] Operations Team
- [ ] Product Owner

**Deployment Date**: _______________
**Deployed By**: _______________
**Version**: _______________

---

**🎉 Good luck with your deployment!**
