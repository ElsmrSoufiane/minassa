import React, { useState, useEffect } from 'react';
import './MapView.css';


const MapView = ({ problems }) => {
  const [mapData, setMapData] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  
  // مناطق المغرب مع إحداثيات
  const moroccanRegions = [
    { 
      id: 1, 
      name: "الدار البيضاء", 
      x: 65, 
      y: 120, 
      risk: "high",
      problems: 15,
      phones: ["0666666666", "0677777777"],
      description: "أعلى نسبة احتيال بسبب الكثافة السكانية"
    },
    { 
      id: 2, 
      name: "الرباط", 
      x: 80, 
      y: 90, 
      risk: "medium",
      problems: 8,
      phones: ["0688888888"],
      description: "نسبة متوسطة مع حوادث متفرقة"
    },
    { 
      id: 3, 
      name: "مراكش", 
      x: 75, 
      y: 180, 
      risk: "high",
      problems: 12,
      phones: ["0699999999", "0600000000"],
      description: "كثافة سياحية تؤدي لزيادة الحوادث"
    },
    { 
      id: 4, 
      name: "فاس", 
      x: 120, 
      y: 110, 
      risk: "medium",
      problems: 6,
      phones: ["0611111111"],
      description: "منطقة متوسطة الخطورة"
    },
    { 
      id: 5, 
      name: "طنجة", 
      x: 30, 
      y: 60, 
      risk: "medium",
      problems: 9,
      phones: ["0622222222"],
      description: "مدينة حدودية - حوادث متوسطة"
    },
    { 
      id: 6, 
      name: "أكادير", 
      x: 50, 
      y: 220, 
      risk: "low",
      problems: 4,
      phones: ["0633333333"],
      description: "منطقة هادئة - نسبة منخفضة"
    },
    { 
      id: 7, 
      name: "مكناس", 
      x: 100, 
      y: 100, 
      risk: "low",
      problems: 3,
      phones: ["0644444444"],
      description: "نسبة احتيال منخفضة"
    },
    { 
      id: 8, 
      name: "وجدة", 
      x: 160, 
      y: 80, 
      risk: "medium",
      problems: 7,
      phones: ["0655555555"],
      description: "منطقة حدودية - متوسطة الخطورة"
    },
  ];

  useEffect(() => {
    // ربط المشاكل الحقيقية مع المناطق
    const updatedRegions = moroccanRegions.map(region => {
      // حساب المشاكل الحقيقية لهذه المنطقة
      const regionProblems = problems.filter(p => 
        p.city === region.name || 
        (p.phone && region.phones.includes(p.phone))
      );
      
      return {
        ...region,
        actualProblems: regionProblems.length,
        phoneNumbers: [...new Set(regionProblems.map(p => p.phone))],
        totalProblems: regionProblems.length > 0 ? regionProblems.length : region.problems
      };
    });
    
    setMapData(updatedRegions);
  }, [problems]);

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getRiskText = (risk) => {
    switch(risk) {
      case 'high': return 'عالي';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
      default: return 'غير محدد';
    }
  };

  const handleRegionClick = (region) => {
    setSelectedRegion(region);
  };

  return (
    <div className="map-container">
      <h2 className="map-title">خريطة مناطق الاحتيال بالمغرب</h2>
      <p className="map-subtitle">توزيع مشاكل COD حسب المناطق - اللون الأحمر يشير إلى مناطق خطرة</p>
      
      <div className="simple-map-wrapper">
        {/* خريطة مبسطة للمغرب */}
        <div className="morocco-outline">
          {/* رسم حدود المغرب بشكل مبسط */}
          <div className="map-background"></div>
          
          {/* المناطق */}
          {mapData.map(region => (
            <button
              key={region.id}
              className="map-region"
              style={{
                left: `${region.x}%`,
                top: `${region.y}%`,
                backgroundColor: getRiskColor(region.risk),
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => handleRegionClick(region)}
              title={`${region.name} - ${getRiskText(region.risk)} الخطورة`}
            >
              <div className="region-dot"></div>
              <span className="region-name">{region.name}</span>
              <div className="problem-count">{region.totalProblems}</div>
            </button>
          ))}
        </div>
        
        {/* مفتاح الخريطة */}
        <div className="map-legend">
          <h4>مفتاح تفسير الألوان:</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-color high"></span>
              <span>مناطق عالية الخطورة</span>
            </div>
            <div className="legend-item">
              <span className="legend-color medium"></span>
              <span>مناطق متوسطة الخطورة</span>
            </div>
            <div className="legend-item">
              <span className="legend-color low"></span>
              <span>مناطق منخفضة الخطورة</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* تفاصيل المنطقة المحددة */}
      {selectedRegion && (
        <div className="region-details">
          <h3>📍 {selectedRegion.name}</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">مستوى الخطورة:</span>
              <span className={`detail-value risk-${selectedRegion.risk}`}>
                {getRiskText(selectedRegion.risk)}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">عدد المشاكل:</span>
              <span className="detail-value">{selectedRegion.totalProblems}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">الأرقام المشبوهة:</span>
              <div className="phones-list">
                {selectedRegion.phoneNumbers && selectedRegion.phoneNumbers.length > 0 ? (
                  selectedRegion.phoneNumbers.slice(0, 5).map(phone => (
                    <div key={phone} className="phone-item">📞 {phone}</div>
                  ))
                ) : (
                  <span className="no-data">لا توجد أرقام مسجلة</span>
                )}
              </div>
            </div>
            <div className="detail-item full-width">
              <span className="detail-label">الوصف:</span>
              <p className="region-description">{selectedRegion.description}</p>
            </div>
          </div>
          <button 
            className="close-btn"
            onClick={() => setSelectedRegion(null)}
          >
            إغلاق
          </button>
        </div>
      )}
      
      {/* إحصائيات عامة */}
      <div className="map-stats">
        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-info">
            <h3>{mapData.length}</h3>
            <p>منطقة</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <h3>{mapData.filter(r => r.risk === 'high').length}</h3>
            <p>مناطق عالية الخطورة</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📞</div>
          <div className="stat-info">
            <h3>{mapData.reduce((sum, r) => sum + (r.phoneNumbers?.length || 0), 0)}</h3>
            <p>رقم مشبوه</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔍</div>
          <div className="stat-info">
            <h3>{mapData.reduce((sum, r) => sum + r.totalProblems, 0)}</h3>
            <p>مشكلة مسجلة</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;