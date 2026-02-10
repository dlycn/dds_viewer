// src/templates/components.js
module.exports = {
    parameterItem: (label, value, description, icon) => `
        <div class="parameter-item">
            <div class="parameter-header">
                <span class="parameter-icon">${icon}</span>
                <span class="parameter-label">${label}</span>
                <span class="parameter-info" title="${description}">ℹ️</span>
            </div>
            <div class="parameter-value">${value}</div>
        </div>
    `
};