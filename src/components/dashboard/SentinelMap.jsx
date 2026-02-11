import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, ShieldAlert, Globe } from 'lucide-react';

const WorldMapSvg = ({ children }) => (
    <svg viewBox="0 0 1000 500" className="w-full h-full opacity-60">
        <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.5" />
            </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Simplified World Map Paths */}
        <g fill="rgba(6, 182, 212, 0.1)" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="0.5">
            <path d="M250,150 L300,120 L350,140 L340,200 L280,220 L250,150 Z" /> {/* North America (Abstract) */}
            <path d="M300,230 L350,230 L380,300 L320,380 L300,300 Z" /> {/* South America */}
            <path d="M430,120 L480,100 L550,110 L520,180 L480,190 Z" /> {/* Europe */}
            <path d="M450,200 L550,200 L580,300 L500,350 L450,300 Z" /> {/* Africa */}
            <path d="M560,110 L750,110 L800,200 L700,250 L600,220 Z" /> {/* Asia */}
            <path d="M750,300 L850,300 L850,350 L750,350 Z" /> {/* Australia */}

            {/* Realistic-ish Outline (Replaced with Abstract for Style) */}
            {/* Actually, let's use a nice dot grid mask or a proper path if we want high quality. 
                 For now, I'll use a very simplified high-tech abstract representation. */}
        </g>

        {/* World Outline - Simplified for visual aesthetic */}
        <path d="M152.4,179.8c0,0,16.2-22.8,24.6-25.2c8.4-2.4,19.2,2.4,19.2,2.4s12.6-13.8,16.2-7.8c3.6,6,2.4,16.8,2.4,16.8 s13.8,0,16.8-6s9-10.8,9-10.8s1.2-9.6,13.2-6s21,2.4,21,2.4l1.2,14.4c0,0,14.4-1.2,16.8-9.6s-1.2-12-1.2-12s8.4-9.6,18-9.6 s12,9.6,12,9.6l21.6,4.8l2.4,15.6c0,0,14.4,2.4,19.2,0s7.2-13.2,7.2-13.2s16.8,1.2,21.6,8.4s0,10.8,0,10.8l20.4,1.2l9.6-9.6 l19.2,1.2c0,0,10.8,8.4,12,14.4s-3.6,8.4-3.6,8.4l-14.4,9.6c0,0-2.4,13.2-9.6,13.2s-10.8-2.4-10.8-2.4l-6-9.6l-14.4,1.2 l-7.2,12l-19.2-1.2c0,0-7.2-6-10.8-1.2s-8.4,10.8-8.4,10.8l-18,2.4l-7.2-7.2l-15.6,3.6c0,0-7.2-7.2-10.8-2.4s-6,14.4-6,14.4 l-16.8,3.6l-8.4-8.4c-4.6,0.3-9.1,0.5-13.7,0.8l-0.7,0.4l-4.8-1.2L270,166.6l-7.2,2.4L252,157L237.6,163l-4.8,15.6 l-6-2.4l-2.4-9.6L201.6,169l-10.8-8.4L182.4,163L168,158.2l-8.4,10.8l6,21.6L152.4,179.8z"
            fill="none" stroke="rgba(0,0,0,0)" />

        {/* Detailed Map Path (Pre-calculated simplified world for visual context) */}
        <path d="M848.5,123.5c-2.3-0.5-6.8-5.3-6.8-5.3l-5.3,0.8l-6.8-5.3l0.8-6l-4.5-5.3l-10.6-5.3l-2.3,1.5l-0.8-7.5l-9.8-1.5 l-0.8,4.5l-12.8,0l-1.5,4.5l-5.3,1.5l-4.5,4.5l-0.8,7.5l4.5,9.8l-3,3.8l-6.8,0.8l-5.3-3.8l-3-6l-9.1,1.5l-4.5-3.8l-2.3,2.3 l-2.3,9.1l-6.8,0.8l-1.5-6.8l-6,0l-4.5-4.5l-12.8-0.8l-3.8-3.8l-2.3,3l-0.8,8.3l-4.5,3.8l-10.6,0l-8.3-4.5l-4.5-9.1l-3.8,0.8 l-3-3l-7.5-0.8l-10.6,15.1l-11.3,0.8l-7.5-6.8l-12.1,3.8l-6.8-1.5l-3-6.8l-12.1-1.5l-3.8,1.5l-6,11.3l-5.3,3.8l-0.8,9.1 l-4.5,5.3l-10.6,6l-8.3,0.8l-6-3l-0.8,5.3l2.3,15.1l4.5,7.5l3.8,3l-0.8,5.3l-12.1,15.1l-5.3,2.3l-0.8,6.8l-5.3,3 l-13.6,1.5l-5.3-3.8l-0.8-9.1l-6-5.3l-7.5,0.8l-8.3,9.8l-8.3,9.1l0.8,6l3.8,3.8l1.5,10.6l-5.3,4.5l-7.5,0.8l-3,6.8 l7.5,6l12.1-0.8l9.1,4.5l2.3,5.3l-1.5,5.3l-19.6,9.1l-6-1.5l-7.5-6.8l-5.3,1.5l-6,9.8l-0.8,5.3l5.3,12.1l11.3,7.5 l2.3,6.8l-3,9.1l-6,7.5l-4.5-0.8l-6.8-6l-9.1,6.8l-5.3,6l-0.8,8.3l6.8,8.3l12.1,3.8l5.3,0.8l3,6.8l-0.8,5.3l-6.8,4.5 l-0.8,6.8l5.3,5.3l11.3,2.3l11.3-4.5l11.3-0.8l3-5.3l1.5-12.1l-0.8-7.5l-4.5-8.3l-9.1-3.8l-2.3-10.6l2.3-9.8l5.3-3.8 l11.3-0.8l6.8,3l9.8-3l7.5-3.8l7.5-5.3l8.3-9.8l10.6,4.5l0.8,4.5l-2.3,6.8l-3,6l4.5,1.5l6-3.8l3-7.5l9.8-3.8l5.3,2.3 l1.5,6.8l7.5,3.8l3-3l6-1.5l4.5-6l3-8.3l-1.5-6l-5.3-1.5l-6.8,5.3l-1.5,8.3l-3.8,3l-3.8-3l0.8-5.3l6-3.8l5.3,2.3 l3.8-2.3l2.3-4.5l12.1,3.8l4.5-3.8l6.8-4.5l6-0.8l6.8,3.8l5.3,8.3l4.5,0.8l6.8-2.3l5.3-6.8l8.3-10.6l-0.8-6l-5.3-5.3 l-2.3-7.5l2.3-9.1l6.8-6.8l6-0.8l3.8,1.5l3.8,6.8l4.5,1.5l6-3l4.5-8.3l3-7.5l-3.8-7.5l-2.3-6l-6.8-0.8l-1.5-5.3l2.3-4.5 l4.5-1.5l5.3,1.5l3.8,3.8l3.8,0.8l2.3-3.8l-2.3-6l-5.3-1.5l-3-3.8l-0.8-7.5l3-6l6.8-0.8l6-6.8l-0.8-6.8l-4.5-6l-6.8-3.8 l-2.3-7.5l2.3-5.3l6-0.8l8.3,2.3l9.1,0.8l6,5.3l3,4.5l-0.8,6l-5.3,5.3l-5.3,8.3l-0.8,5.3l2.3,3.8l8.3,0.8l6-1.5l4.5-5.3 l-0.8-6.8l-3.8-4.5l-4.5-1.5l-2.3-6l2.3-4.5l7.5-6.8l-0.8-6l-4.5-6l-6.8-4.5l-3.8-0.8l-4.5,3.8l-5.3,1.5l-3-3l1.5-6 l3.8-3.8l6.8,0.8l7.5,1.5l4.5-1.5l4.5-5.3l2.3-8.3l6-3l7.5-0.8l3-3l-2.3-5.3l-5.3-3.8l-2.3-7.5l3-3.8l6.8-0.8l3-4.5l6-1.5 l5.3,3.8l3.8,3.8l2.3,9.1l0.8,5.3l-2.3,3l-3.8,0.8l-6,3.8l-1.5,5.3l3,3.8l6.8,1.5l5.3-1.5l1.5-6l-1.5-6.8l-5.3-4.5 l-0.8-5.3l3-3.8l6.8-0.8l4.5,2.3l4.5,5.3l6,1.5l4.5-0.8l-0.8-4.5l-3.8-3.8l-4.5-1.5l-6-3l-1.5-5.3l1.5-5.3l4.5-3l14.3-1.5 l6.8,4.5l3,6.8l-1.5,6l-4.5,5.3l-4.5,3.8l-0.8,5.3l2.3,3.8l5.3,0.8l4.5-4.5l2.3-6.8l-1.5-4.5l-6-3l-0.8-4.5l2.3-3.8 l5.3-0.8l4.5,2.3l3.8,6.8l5.3,4.5l6,0.8l3.8-3l1.5-6.8l-1.5-5.3l-4.5-3.8l-6-1.5l-2.3-4.5l1.5-4.5l6.8-1.5l9.1,1.5l3,3.8 l-0.8,6.8l-3.8,4.5l-3,5.3l2.3,3.8l6.8,1.5l6-1.5l2.3-5.3l-1.5-6l-4.5-3.8l-6,0.8l-3.8-2.3l-0.8-4.5l2.3-3.8l5.3-0.8 l6,3l3.8,4.5l3.8,9.1l5.3,6.8l7.5,3.8l2.3-2.3l-1.5-5.3l-4.5-3.8l-5.3,0.8l-4.5-2.3l-1.5-5.3l2.3-3.8l6.8-1.5l5.3,2.3 l2.3,5.3l-0.8,4.5l-4.5,4.5l-1.5,5.3l2.3,3l5.3,1.5l4.5-3l1.5-6l-2.3-4.5l-6-1.5l-1.5-4.5l1.5-4.5l6,0.8l5.3,3.8l3.8,7.5 l0.8,3.8h0"
            fill="#202022" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />

        {children}
    </svg>
);

export function SentinelMap() {
    const [users, setUsers] = useState([]);
    const [threats, setThreats] = useState([]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch('/api/users');
                const data = await response.json();
                const userList = Array.isArray(data.users) ? data.users : [];
                setUsers(userList);

                // Simulate/Identify Threats
                const detectedThreats = userList.filter(u =>
                    u.status === 'banned' ||
                    u.fairPlayRiskScore > 50 ||
                    u.isShadowBanned
                );
                setThreats(detectedThreats);
            } catch (error) {
                console.error("Sentinel Link Failure", error);
            }
        };

        fetchUserData();
        const interval = setInterval(fetchUserData, 15000); // Live poll
        return () => clearInterval(interval);
    }, []);

    // Convert Lat/Lon to SVG Coordinates
    // Approximate Equirectangular projection mapping for the 1000x500 viewBox
    const getCoordinates = (lat, lon) => {
        // Map Lon (-180 to 180) to X (0 to 1000)
        const x = (lon + 180) * (1000 / 360);
        // Map Lat (90 to -90) to Y (0 to 500)
        const y = ((-lat) + 90) * (500 / 180);
        return { x, y };
    };

    return (
        <div className="w-full h-full relative group overflow-hidden bg-[#070708] rounded-[2.5rem]">
            {/* Map Background */}
            <div className="absolute inset-0 z-0">
                <WorldMapSvg>
                    {/* Render User Nodes */}
                    {users.map((user, i) => {
                        if (!user.coordinates || !user.coordinates.lat || !user.coordinates.lon) return null; // Skip if no geo-data

                        const { lat, lon } = user.coordinates;
                        const { x, y } = getCoordinates(lat, lon);
                        const isThreat = threats.find(t => t._id === user._id);

                        return (
                            <motion.g
                                key={user._id || i}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05, duration: 0.5 }}
                            >
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={isThreat ? 4 : 2}
                                    fill={isThreat ? "#ef4444" : "#06b6d4"}
                                    opacity={0.8}
                                >
                                    {isThreat && (
                                        <animate
                                            attributeName="r"
                                            values="4;8;4"
                                            dur="1.5s"
                                            repeatCount="indefinite"
                                        />

                                    )}
                                    {isThreat && (
                                        <animate
                                            attributeName="opacity"
                                            values="1;0.3;1"
                                            dur="1.5s"
                                            repeatCount="indefinite"
                                        />
                                    )}
                                </circle>

                                {/* Connecting Lines for Threats (Triangulation effect) */}
                                {isThreat && (
                                    <circle cx={x} cy={y} r={10} stroke="#ef4444" strokeWidth="0.5" fill="none" opacity="0.3">
                                        <animate
                                            attributeName="r"
                                            values="10;20"
                                            dur="2s"
                                            repeatCount="indefinite"
                                        />
                                        <animate
                                            attributeName="opacity"
                                            values="0.3;0"
                                            dur="2s"
                                            repeatCount="indefinite"
                                        />
                                    </circle>
                                )}
                            </motion.g>
                        );
                    })}
                </WorldMapSvg>
            </div>

            {/* Overlay UI */}
            <div className="absolute top-6 left-8 z-20">
                <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-primary animate-pulse" />
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">Geographic Overview</h3>
                </div>
                <div className="flex items-center gap-4 mt-2">
                    <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg backdrop-blur-md">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                            Players Online: {users.length}
                        </p>
                    </div>
                    {threats.length > 0 && (
                        <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg backdrop-blur-md flex items-center gap-2">
                            <ShieldAlert className="w-3 h-3 text-red-500" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                                Active Risks: {threats.length}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Scan Line Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-[20%] w-full animate-scan pointer-events-none z-10"></div>

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] opacity-60 z-10 pointer-events-none"></div>
        </div>
    );
}
