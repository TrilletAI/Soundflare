"use client"

import { useState } from "react"
import { Check, Zap, Star, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { motion } from "motion/react"

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)

  const plans = [
    {
      name: "Pro",
      description: "For individuals getting started with voice AI testing",
      icon: Zap,
      monthlyPrice: 20,
      yearlyPrice: 192,
      features: [
        "500 simulated calls",
        "500 call reviews",
        "Email alerts",
        "Overage at 5¢ per call or review",
      ],
      popular: false,
    },
    {
      name: "Pro+",
      description: "For teams that need more power and integrations",
      icon: Star,
      monthlyPrice: 60,
      yearlyPrice: 576,
      features: [
        "1,500 simulated calls",
        "1,500 call reviews",
        "Native Slack support & alerts",
        "Early access features",
        "Overage at 5¢ per call or review",
      ],
      popular: true,
    },
    {
      name: "Ultra",
      description: "For enterprises with high-volume testing needs",
      icon: Crown,
      monthlyPrice: 200,
      yearlyPrice: 1920,
      features: [
        "10,000 simulated calls",
        "10,000 call reviews",
        "Customizable review agents",
        "Priority support",
        "Overage at 5¢ per call or review",
      ],
      popular: false,
    },
  ]

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-balance mb-4 tracking-tight">Simple, transparent pricing</h2>
          <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto mb-8">
            Choose the plan that fits your voice AI testing needs. Scale as you grow.
          </p>

          <div className="flex items-center justify-center space-x-4">
            <span className={`text-sm font-medium ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </span>
            <Switch checked={isYearly} onCheckedChange={setIsYearly} className="data-[state=checked]:bg-[#ff4d00]" />
            <span className={`text-sm font-medium ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
              Yearly
            </span>
            <span className="text-sm bg-[#ff4d00]/10 text-[#ff4d00] px-3 py-1 rounded-full font-medium">Save 20%</span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const Icon = plan.icon
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice
            const period = isYearly ? "year" : "month"
            const monthlyEquivalent = isYearly ? Math.round(plan.yearlyPrice / 12) : null

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className={`relative flex flex-col h-full ${plan.popular ? "border-[#ff4d00] shadow-lg shadow-[#ff4d00]/10 scale-105" : ""}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-[#ff4d00] text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <CardHeader className="text-center pb-8">
                    <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${plan.popular ? "bg-[#ff4d00]/20" : "bg-[#ff4d00]/10"}`}>
                      <Icon className={`w-6 h-6 ${plan.popular ? "text-[#ff4d00]" : "text-[#ff4d00]"}`} />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="text-balance">{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">${price}</span>
                      <span className="text-muted-foreground">/{period}</span>
                      {monthlyEquivalent && (
                        <p className="text-sm text-muted-foreground mt-1">${monthlyEquivalent}/mo billed yearly</p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-grow">
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start space-x-3">
                          <Check className="w-5 h-5 text-[#ff4d00] mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className={`w-full ${plan.popular ? "bg-[#ff4d00] hover:bg-[#e64500] text-white" : ""}`}
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                    >
                      Get Started
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
