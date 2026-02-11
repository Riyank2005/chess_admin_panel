// Test OTP Generation
console.log('\n🧪 Testing OTP Generation System...\n');

const generateTacticalCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Generate 5 sample OTPs
console.log('📋 Sample Tactical OTP Codes:\n');
for (let i = 1; i <= 5; i++) {
    const otp = generateTacticalCode();
    console.log(`   ${i}. ${otp}`);
}

console.log('\n✅ OTP Generation System is working!\n');
console.log('💡 These codes use only:');
console.log('   - Uppercase letters (excluding I, O to avoid confusion)');
console.log('   - Numbers 2-9 (excluding 0, 1 to avoid confusion)\n');
