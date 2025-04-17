import React from 'react';
import { Card } from 'react-bootstrap';

const StatCard = ({ title, value, icon, trend, trendValue, trendText, color = "#d30000" }) => {
    const getTrendIcon = () => {
        if (trend === 'up') return 'bi-arrow-up-right';
        if (trend === 'down') return 'bi-arrow-down-right';
        return 'bi-dash';
    };

    const getTrendClass = () => {
        if (trend === 'up') return 'trend up';
        if (trend === 'down') return 'trend down';
        return 'trend';
    };

    return (
        <Card className="stat-card">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="icon" style={{ backgroundColor: `${color}15`, color: color }}>
                    <i className={`bi ${icon}`}></i>
                </div>
                {trend && trendValue && (
                    <div className={getTrendClass()}>
                        <i className={`bi ${getTrendIcon()} me-1`}></i>
                        <span>{trendValue}% {trendText || ''}</span>
                    </div>
                )}
            </div>
            <h3>{value}</h3>
            <p>{title}</p>
        </Card>
    );
};

export default StatCard;
