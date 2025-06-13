const mongoose = require('mongoose');

const adminNotificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['vet_approval', 'other'],
        required: true
    },
    vetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
        required: true
    },
    vetName: String,
    clinicName: String,
    licenseImage: String,
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    adminNotes: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    resolvedAt: Date,
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, { timestamps: true });

module.exports = mongoose.model('AdminNotification', adminNotificationSchema);
