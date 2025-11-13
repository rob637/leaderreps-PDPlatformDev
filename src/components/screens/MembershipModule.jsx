import React, { useState, useMemo, useCallback } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx'; // Canonical path used by other screen components
import { MEMBERSHIP_TIERS } from '../../services/membershipService.js';
import { DollarSign, Zap, Clock, CheckCircle, CreditCard, AlertTriangle, X, ShieldCheck, CornerRightUp, RefreshCw, Trash2, Mail, Bell } from 'lucide-react';
import { CORPORATE_COLORS } from '../../styles/corporate-colors.js';


// --- Local Components for Modularity and Style ---

const COLORS = CORPORATE_COLORS;

const Card = ({ title, children, accent = 'TEAL', icon: Icon, className = '' }) => {
    const accentColor = COLORS[accent] || COLORS.TEAL;
    return (
        <div 
            className={`bg-white rounded-xl shadow-lg p-6 border-t-4 ${className}`}
            style={{ borderColor: accentColor }}
        >
            <div className="flex items-center mb-4">
                {Icon && <Icon className="w-6 h-6 mr-3" style={{ color: accentColor }} />}
                <h2 className="text-xl font-bold" style={{ color: COLORS.NAVY }}>{title}</h2>
            </div>
            {children}
        </div>
    );
};

const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false }) => {
    let style = { background: COLORS.TEAL, color: 'white' };
    let padding = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-base';

    if (variant === 'secondary') {
        style = { background: COLORS.NAVY, color: 'white' };
    } else if (variant === 'outline') {
        style = { border: `1px solid ${COLORS.TEAL}`, color: COLORS.TEAL, background: 'white' };
    } else if (variant === 'danger') {
        style = { background: COLORS.RED, color: 'white' };
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${padding} rounded-lg font-semibold transition-all duration-200 hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            style={style}
        >
            {children}
        </button>
    );
};

const NotificationBanner = ({ notification, onDismiss }) => {
    let baseStyle = 'bg-blue-50 border-blue-200 text-blue-700';
    let Icon = Bell;
    if (notification.type === 'warning' || notification.type === 'expiration') {
        baseStyle = 'bg-yellow-50 border-yellow-200 text-yellow-700';
        Icon = AlertTriangle;
    } else if (notification.type === 'error') {
        baseStyle = 'bg-red-50 border-red-200 text-red-700';
        Icon = X;
    } else if (notification.type === 'success') {
        baseStyle = 'bg-green-50 border-green-200 text-green-700';
        Icon = CheckCircle;
    }

    return (
        <div className={`flex justify-between items-start p-4 rounded-lg border shadow-sm ${baseStyle}`}>
            <div className="flex items-start">
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5 mr-3" />
                <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button 
                onClick={() => onDismiss(notification.id)}
                className={`ml-4 p-1 rounded-full opacity-70 hover:opacity-100 transition-opacity`}
                style={{ color: COLORS.MUTED }}
                title="Dismiss"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

// --- Main Membership Module Component ---
const MembershipModule = () => {
    const { 
        membershipData, 
        updateMembershipData, 
        isLoading,
        user
    } = useAppServices(); // cite: useAppServices.jsx

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [paymentStatus, setPaymentStatus] = useState(null); // 'processing', 'success', 'failure'
    
    // Convert to Date object for easier handling
    const nextBillingDate = useMemo(() => {
        if (!membershipData?.nextBillingDate) return null;
        try {
            return new Date(membershipData.nextBillingDate);
        } catch (e) {
            return null;
        }
    }, [membershipData?.nextBillingDate]);

    // Current Plan Details - Updated to use new MEMBERSHIP_TIERS
    const currentPlanDetails = useMemo(() => {
        const currentTier = membershipData?.currentTier || 'basic';
        return MEMBERSHIP_TIERS[currentTier] || MEMBERSHIP_TIERS.basic;
    }, [membershipData?.currentTier]);
    
    // Available upgrade plans - Updated to use new MEMBERSHIP_TIERS
    const upgradePlans = useMemo(() => {
        const currentTier = membershipData?.currentTier || 'basic';
        const availableTiers = ['basic', 'professional', 'elite'];
        
        return availableTiers
            .filter(tier => tier !== currentTier)
            .map(tier => MEMBERSHIP_TIERS[tier]);
    }, [membershipData?.currentTier]);


    // --- Handlers ---
    
    const handlePlanSelection = (plan) => {
        setSelectedPlan(plan);
        setModalOpen(true);
        setPaymentStatus(null);
    };
    
    const handleDismissNotification = useCallback(async (id) => {
        if (!membershipData || !updateMembershipData) return;
        
        const updatedNotifications = membershipData.notifications.filter(n => n.id !== id);
        await updateMembershipData({ notifications: updatedNotifications });
    }, [membershipData, updateMembershipData]);

    const handleMockPayment = useCallback(async () => {
        if (!selectedPlan) return;

        setPaymentStatus('processing');
        
        // Mock payment delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const success = Math.random() > 0.1; // 90% chance of success

        if (success) {
            // Calculate next billing date (e.g., 30 days from now for monthly, 365 for annual)
            const today = new Date();
            let nextDate = new Date(today);
            if (selectedPlan.recurrence === 'Monthly') {
                nextDate.setDate(today.getDate() + 30);
            } else if (selectedPlan.recurrence === 'Annually') {
                nextDate.setDate(today.getDate() + 365);
            }
            
            const newPaymentRecord = {
                date: new Date().toISOString(),
                amount: selectedPlan.price,
                method: paymentMethod,
                status: 'Success',
                planId: selectedPlan.id,
                recurrence: selectedPlan.recurrence,
            };

            // Remove all warning/expiration notifications upon successful payment
            const newNotifications = membershipData.notifications.filter(n => n.type !== 'warning' && n.type !== 'expiration');
            newNotifications.push({ 
                id: `upgrade-${Date.now()}`, 
                message: `Upgrade to ${selectedPlan.name} successful!`, 
                type: 'success', 
                isRead: false 
            });

            await updateMembershipData({
                status: 'Active',
                currentPlanId: selectedPlan.id,
                nextBillingDate: nextDate.toISOString().split('T')[0],
                paymentHistory: [...membershipData.paymentHistory, newPaymentRecord],
                notifications: newNotifications
            });

            setPaymentStatus('success');
            setTimeout(() => setModalOpen(false), 2000);

        } else {
            setPaymentStatus('failure');
            // Log failure to history as well
            const failedRecord = {
                date: new Date().toISOString(),
                amount: selectedPlan.price,
                method: paymentMethod,
                status: 'Failed',
                planId: selectedPlan.id,
                recurrence: selectedPlan.recurrence,
                error: 'Payment declined by mock gateway.'
            };
            await updateMembershipData({
                paymentHistory: [...membershipData.paymentHistory, failedRecord]
            });
            // Show error message
            setTimeout(() => setPaymentStatus(null), 3000);
        }
    }, [selectedPlan, paymentMethod, membershipData, updateMembershipData]);


    if (isLoading || !membershipData) {
        return (
            <div className="flex items-center justify-center h-full min-h-screen">
                <Zap className="w-8 h-8 animate-spin" style={{ color: COLORS.TEAL }} />
            </div>
        );
    }
    
    const statusColor = membershipData.status === 'Active' ? 'GREEN' : (membershipData.status.includes('Trial') ? 'BLUE' : 'RED');

    // --- RENDER ---
    return (
        <div className="min-h-screen" style={{ background: COLORS.BG }}>
            <div className="container mx-auto px-4 py-6 max-w-7xl">
                
                {/* Header */}
                <h1 className="text-3xl md:text-4xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>
                    Membership & Billing
                </h1>
                <p className="text-base mb-6" style={{ color: COLORS.MUTED }}>
                    Manage your plan, payments, and account status here.
                </p>

                {/* Notifications Panel */}
                {membershipData.notifications.length > 0 && (
                    <div className="mb-6 space-y-3">
                        <h3 className="text-lg font-bold" style={{ color: COLORS.NAVY }}>
                            <Mail className="inline-block w-5 h-5 mr-2" style={{ color: COLORS.ORANGE }} /> Notifications
                        </h3>
                        {membershipData.notifications.map(n => (
                            <NotificationBanner 
                                key={n.id} 
                                notification={n} 
                                onDismiss={handleDismissNotification} 
                            />
                        ))}
                    </div>
                )}
                
                {/* Current Plan and Upgrade Plans */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    
                    {/* Current Plan Card (Span 1) */}
                    <Card title="Current Plan" accent={statusColor} icon={ShieldCheck} className="lg:col-span-1">
                        <p className="text-sm font-semibold mb-2" style={{ color: COLORS.MUTED }}>
                            STATUS: <span className={`font-extrabold uppercase`} style={{ color: COLORS[statusColor] }}>
                                {membershipData.status}
                            </span>
                        </p>
                        <h3 className="text-2xl font-extrabold mb-4" style={{ color: COLORS.NAVY }}>
                            {currentPlanDetails.name}
                        </h3>
                        
                        {nextBillingDate && (
                            <div className="flex items-center text-sm font-medium mb-4 p-3 rounded-lg bg-gray-50 border">
                                <Clock className="w-4 h-4 mr-2" style={{ color: COLORS.TEAL }} />
                                <p>Next Billing Date: <strong>{nextBillingDate.toDateString()}</strong></p>
                            </div>
                        )}
                        
                        <p className="font-semibold text-base mb-2" style={{ color: COLORS.NAVY }}>Your Features:</p>
                        <ul className="space-y-1 text-sm">
                            {currentPlanDetails.features && Object.entries(currentPlanDetails.features).map(([key, value], index) => (
                                <li key={index} className="flex items-center text-gray-700">
                                    <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: COLORS.GREEN }} />
                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                                </li>
                            ))}
                        </ul>

                        {membershipData.status !== 'Active' && (
                             <Button 
                                onClick={() => handlePlanSelection(upgradePlans.find(p => p.id === 'pro') || currentPlanDetails)} // Fallback to current plan if pro isn't in upgrade list
                                variant="primary" 
                                size="md" 
                                className="w-full mt-6"
                             >
                                Unlock Full Access
                            </Button>
                        )}
                    </Card>

                    {/* Available Plans (Span 2) */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>Upgrade Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {upgradePlans.map(plan => (
                                <div 
                                    key={plan.id} 
                                    className="bg-white rounded-xl shadow-md p-6 border-t-4 hover:shadow-xl transition-shadow duration-300"
                                    style={{ borderColor: plan.id === 'pro' ? COLORS.PURPLE : COLORS.BLUE }}
                                >
                                    <h4 className="text-xl font-extrabold mb-1" style={{ color: COLORS.NAVY }}>{plan.name}</h4>
                                    <p className="text-sm font-semibold mb-3" style={{ color: COLORS.MUTED }}>{plan.recurrence}</p>
                                    
                                    <p className="text-3xl font-extrabold mb-4" style={{ color: COLORS.NAVY }}>
                                        <DollarSign className="inline-block w-6 h-6" />{plan.price}
                                        <span className="text-base font-medium text-gray-500">/{plan.recurrence ? plan.recurrence.toLowerCase().replace('ly', '').replace('ally', '') : 'period'}</span>
                                    </p>
                                    
                                    <ul className="space-y-2 text-sm mb-6">
                                        {plan.features && Object.entries(plan.features).map(([key, value], index) => (
                                            <li key={index} className="flex items-center text-gray-700">
                                                <CornerRightUp className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: COLORS.ORANGE }} />
                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                                            </li>
                                        ))}
                                    </ul>

                                    <Button 
                                        onClick={() => handlePlanSelection(plan)}
                                        variant={plan.id === 'pro' ? 'secondary' : 'outline'}
                                        size="md" 
                                        className="w-full"
                                    >
                                        Select {plan.name}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Payment History */}
                <Card title="Payment History" accent='NAVY' icon={DollarSign}>
                    <div className="overflow-x-auto">
                        {membershipData.paymentHistory.length === 0 ? (
                            <p className="text-sm text-center py-4" style={{ color: COLORS.MUTED }}>No payment history found.</p>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead style={{ backgroundColor: COLORS.LIGHT_GRAY }}>
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: COLORS.MUTED }}>Plan</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: COLORS.MUTED }}>Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: COLORS.MUTED }}>Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: COLORS.MUTED }}>Method</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: COLORS.MUTED }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {membershipData.paymentHistory.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: COLORS.NAVY }}>{item.planId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${item.amount.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(item.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.method}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold" style={{ color: item.status === 'Success' ? COLORS.GREEN : COLORS.RED }}>{item.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </Card>
            </div>

            {/* --- Payment Modal --- */}
            {modalOpen && selectedPlan && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
                                Secure Checkout: {selectedPlan.name}
                            </h2>
                            <button onClick={() => setModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                                <X className="w-6 h-6" style={{ color: COLORS.MUTED }} />
                            </button>
                        </div>
                        
                        {/* Summary */}
                        <div className="border-b pb-4 mb-4">
                            <p className="text-lg font-semibold" style={{ color: COLORS.TEXT }}>
                                Total Due Today: 
                                <span className="ml-2 text-2xl font-extrabold" style={{ color: COLORS.TEAL }}>
                                    ${selectedPlan.price.toFixed(2)}
                                </span>
                                <span className="text-sm text-gray-500"> / {selectedPlan.recurrence}</span>
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Renews automatically. Cancel anytime.
                            </p>
                        </div>

                        {/* Payment Method Selection */}
                        <h3 className="text-lg font-bold mb-3" style={{ color: COLORS.NAVY }}>
                            1. Select Payment Method
                        </h3>
                        <div className="flex space-x-4 mb-6">
                            {['card', 'paypal', 'invoice'].map(method => (
                                <button 
                                    key={method}
                                    onClick={() => setPaymentMethod(method)}
                                    className={`flex-1 p-3 rounded-lg border-2 transition-all duration-200 ${
                                        paymentMethod === method 
                                            ? 'border-purple-600 shadow-lg' 
                                            : 'border-gray-200 hover:border-gray-400'
                                    }`}
                                >
                                    <CreditCard className="w-5 h-5 mx-auto mb-1" style={{ color: paymentMethod === method ? COLORS.PURPLE : COLORS.MUTED }} />
                                    <span className="text-xs font-semibold uppercase">{method}</span>
                                </button>
                            ))}
                        </div>

                        {/* Mock Payment Details */}
                        <h3 className="text-lg font-bold mb-3" style={{ color: COLORS.NAVY }}>
                            2. Payment Details ({paymentMethod.toUpperCase()})
                        </h3>
                        {paymentMethod === 'card' && (
                            <div className="space-y-3 mb-6">
                                <input type="text" placeholder="Card Number (Mock: 1111 ****)" className="w-full p-3 border border-gray-300 rounded-lg" disabled={paymentStatus === 'processing'} />
                                <div className="flex space-x-3">
                                    <input type="text" placeholder="MM/YY" className="w-1/2 p-3 border border-gray-300 rounded-lg" disabled={paymentStatus === 'processing'} />
                                    <input type="text" placeholder="CVC" className="w-1/2 p-3 border border-gray-300 rounded-lg" disabled={paymentStatus === 'processing'} />
                                </div>
                            </div>
                        )}
                        {paymentMethod === 'paypal' && (
                            <p className="p-3 bg-blue-100 border border-blue-300 rounded-lg mb-6 text-sm text-blue-800">
                                This would redirect you to the PayPal gateway for a one-time payment authorization.
                            </p>
                        )}
                        {paymentMethod === 'invoice' && (
                            <p className="p-3 bg-amber-100 border border-amber-300 rounded-lg mb-6 text-sm text-amber-800">
                                A yearly invoice of ${selectedPlan.price.toFixed(2)} will be sent to {user?.email || 'your email address'}. Service begins upon payment.
                            </p>
                        )}

                        {/* Action Button */}
                        <Button 
                            onClick={handleMockPayment}
                            variant="primary" 
                            size="md" 
                            className="w-full"
                            disabled={paymentStatus === 'processing' || paymentStatus === 'success'}
                        >
                            {paymentStatus === 'processing' && <RefreshCw className="w-5 h-5 mr-2 animate-spin" />}
                            {paymentStatus === 'processing' ? 'Processing Payment...' : 
                             paymentStatus === 'success' ? <><CheckCircle className="w-5 h-5 mr-2" /> Successful!</> :
                             paymentStatus === 'failure' ? 'Payment Failed (Retry)' :
                             `Confirm & Pay $${selectedPlan.price.toFixed(2)}`}
                        </Button>
                        
                        {paymentStatus === 'failure' && (
                             <p className="text-sm text-center mt-3 font-semibold" style={{ color: COLORS.RED }}>
                                Transaction declined. Please try a different method.
                             </p>
                        )}
                        
                        <p className="text-xs text-center text-gray-400 mt-4">
                            All payments are handled securely by a mock PCI-compliant gateway.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembershipModule;
