import React, { useState, useEffect } from 'react'
import { useSwipeable } from 'react-swipeable'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAnUlM61mU26eN75AwphUEdgE-Tijei5Ag",
  authDomain: "time-money-399cb.firebaseapp.com",
  projectId: "time-money-399cb",
  storageBucket: "time-money-399cb.appspot.com",
  messagingSenderId: "35350837341",
  appId: "1:35350837341:web:45a73cf3a143f8021435b4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function TimeMoney() {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState({
    nume: "",
    valuta: "RON",
    tipPersoana: "fizica"
  })
  const [sarcini, setSarcini] = useState({})
  const [sarcinaNoua, setSarcinaNoua] = useState("")
  const [dataSelectata, setDataSelectata] = useState(new Date())
  const [incasari, setIncasari] = useState({})
  const [cheltuieli, setCheltuieli] = useState({})

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user)
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setUserData(data.userData)
          setSarcini(data.sarcini || {})
          setIncasari(data.incasari || {})
          setCheltuieli(data.cheltuieli || {})
        }
      } else {
        setUser(null)
        setUserData({ nume: "", valuta: "RON", tipPersoana: "fizica" })
        setSarcini({})
        setIncasari({})
        setCheltuieli({})
      }
    })

    return () => unsubscribe()
  }, [])

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      setUser(user)
      await setDoc(doc(db, 'users', user.uid), {
        userData: { ...userData, nume: user.displayName || "" },
        sarcini: {},
        incasari: {},
        cheltuieli: {}
      }, { merge: true })
    } catch (error) {
      console.error("Eroare la autentificare:", error)
    }
  }

  const handleLogout = async () => {
    try {
      await auth.signOut()
      setUser(null)
    } catch (error) {
      console.error("Eroare la deconectare:", error)
    }
  }

  const saveToFirebase = async () => {
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), {
        userData,
        sarcini,
        incasari,
        cheltuieli
      })
    }
  }

  const adaugaSarcina = () => {
    if (sarcinaNoua.trim() !== "") {
      const dataKey = dataSelectata.toISOString().split('T')[0]
      const newSarcini = {
        ...sarcini,
        [dataKey]: [
          ...(sarcini[dataKey] || []),
          { text: sarcinaNoua, completata: false, data: dataKey }
        ]
      }
      setSarcini(newSarcini)
      setSarcinaNoua("")
      saveToFirebase()
    }
  }

  const comutaSarcina = (index: number) => {
    const dataKey = dataSelectata.toISOString().split('T')[0]
    const newSarcini = {
      ...sarcini,
      [dataKey]: sarcini[dataKey].map((sarcina, idx) => 
        idx === index ? { ...sarcina, completata: !sarcina.completata } : sarcina
      )
    }
    setSarcini(newSarcini)
    saveToFirebase()
  }

  const schimbaDataSarcina = (index: number, nouaData: Date) => {
    const dataVecheKey = dataSelectata.toISOString().split('T')[0]
    const dataNoua = nouaData.toISOString().split('T')[0]
    const sarcinaDeModificat = sarcini[dataVecheKey][index]
    const sarciniVechiActualizate = sarcini[dataVecheKey].filter((_, idx) => idx !== index)
    const newSarcini = {
      ...sarcini,
      [dataVecheKey]: sarciniVechiActualizate,
      [dataNoua]: [
        ...(sarcini[dataNoua] || []),
        { ...sarcinaDeModificat, data: dataNoua }
      ]
    }
    setSarcini(newSarcini)
    saveToFirebase()
  }

  const adaugaIncasare = (categorie: string, suma: string) => {
    const data = new Date()
    const lunaAn = `${data.getMonth() + 1}-${data.getFullYear()}`
    const newIncasari = {
      ...incasari,
      [lunaAn]: {
        ...incasari[lunaAn],
        [categorie]: (incasari[lunaAn]?.[categorie] || 0) + Number(suma)
      }
    }
    setIncasari(newIncasari)
    saveToFirebase()
  }

  const adaugaCheltuiala = (categorie: string, suma: string) => {
    const data = new Date()
    const lunaAn = `${data.getMonth() + 1}-${data.getFullYear()}`
    const newCheltuieli = {
      ...cheltuieli,
      [lunaAn]: {
        ...cheltuieli[lunaAn],
        [categorie]: (cheltuieli[lunaAn]?.[categorie] || 0) + Number(suma)
      }
    }
    setCheltuieli(newCheltuieli)
    saveToFirebase()
  }

  const schimbaZi = (zile: number) => {
    const nouaData = new Date(dataSelectata)
    nouaData.setDate(nouaData.getDate() + zile)
    setDataSelectata(nouaData)
  }

  const handlers = useSwipeable({
    onSwipedLeft: () => schimbaZi(1),
    onSwipedRight: () => schimbaZi(-1),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  })

  const categoriiIncasari = {
    fizica: ['Salarii', 'Donații'],
    juridica: ['Parteneriate', 'Campanii de colectare', 'Contracte de servicii sau produse', 'Prestare servicii']
  }

  const categoriiCheltuieli = {
    fizica: ['Locuință', 'Alimente', 'Transport', 'Sănătate', 'Îmbrăcăminte și încălțăminte', 'Educație și dezvoltare personală', 'Divertisment și timp liber', 'Asigurări și economii', 'Cadouri și donații', 'Datorii și împrumuturi', 'Cheltuieli personale'],
    juridica: ['Impozite', 'Plăți dividente', 'Salarii angajați', 'Investiții', 'Achiziționare business']
  }

  const pregatesteDataRaport = () => {
    const luniUnice = [...new Set([...Object.keys(incasari), ...Object.keys(cheltuieli)])]
    return luniUnice.map(luna => {
      const [month, year] = luna.split('-')
      const totalIncasari = Object.values(incasari[luna] || {}).reduce((sum, val) => sum + (val as number), 0)
      const totalCheltuieli = Object.values(cheltuieli[luna] || {}).reduce((sum, val) => sum + (val as number), 0)
      return {
        luna: `${month}/${year}`,
        incasari: totalIncasari,
        cheltuieli: totalCheltuieli,
        balanta: totalIncasari - totalCheltuieli
      }
    })
  }

  if (!user) {
    return (
      <Card className="w-[350px] mx-auto mt-10">
        <CardHeader>
          <CardTitle>Bun venit la TimeMoney</CardTitle>
          <CardDescription>Conectați-vă pentru a începe</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleGoogleLogin}>
            Conectare cu Google
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Bine ați venit, {userData.nume || user.displayName}!</h1>
        <Button onClick={handleLogout}>Deconectare</Button>
      </div>
      <p className="mb-4">Tip cont: {userData.tipPersoana === 'fizica' ? 'Persoană Fizică' : 'Persoană Juridică'}</p>
      <Tabs defaultValue="sarcini" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sarcini">Sarcini</TabsTrigger>
          <TabsTrigger value="incasari">Încasări</TabsTrigger>
          <TabsTrigger value="cheltuieli">Cheltuieli</TabsTrigger>
          <TabsTrigger value="raport">Raport</TabsTrigger>
        </TabsList>
        <TabsContent value="sarcini">
          <Card>
            <CardHeader>
              <CardTitle>Lista de sarcini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Button onClick={() => schimbaZi(-1)} className="px-2"><ChevronLeft /></Button>
                <h2 className="text-lg font-semibold px-4">{dataSelectata.toLocaleDateString('ro-RO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                <Button onClick={() => schimbaZi(1)} className="px-2"><ChevronRight /></Button>
              </div>
              <div {...handlers} className="touch-pan-y">
                <div className="flex space-x-2 mb-4">
                  <Input
                    type="text"
                    placeholder="Adaugă o sarcină nouă"
                    value={sarcinaNoua}
                    onChange={(e) => setSarcinaNoua(e.target.value)}
                  />
                  <Button onClick={adaugaSarcina}>Adaugă</Button>
                </div>
                <ScrollArea className="h-[300px]">
                  {sarcini[dataSelectata.toISOString().split('T')[0]]?.map((sarcina, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        id={`sarcina-${index}`}
                        checked={sarcina.completata}
                        onCheckedChange={() => comutaSarcina(index)}
                      />
                      <Label
                        htmlFor={`sarcina-${index}`}
                        className={`flex-grow ${sarcina.completata ? "line-through" : ""}`}
                      >
                        {sarcina.text}
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="icon"><CalendarIcon className="h-4 w-4" /></Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={new Date(sarcina.data)}
                            onSelect={(date) => date && schimbaDataSarcina(index, date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="incasari">
          <Card>
            <CardHeader>
              <CardTitle>Încasări</CardTitle>
            </CardHeader>
            <CardContent>
              <FormularIncasariCheltuieli
                onSubmit={(categorie, suma) => adaugaIncasare(categorie, suma)}
                categorii={categoriiIncasari[userData.tipPer

soana]}
                valuta={userData.valuta}
              />
              <AfisareIncasariCheltuieli data={incasari} valuta={userData.valuta} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="cheltuieli">
          <Card>
            <CardHeader>
              <CardTitle>Cheltuieli</CardTitle>
            </CardHeader>
            <CardContent>
              <FormularIncasariCheltuieli
                onSubmit={(categorie, suma) => adaugaCheltuiala(categorie, suma)}
                categorii={categoriiCheltuieli[userData.tipPersoana]}
                valuta={userData.valuta}
              />
              <AfisareIncasariCheltuieli data={cheltuieli} valuta={userData.valuta} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="raport">
          <Card>
            <CardHeader>
              <CardTitle>Raport Financiar</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={pregatesteDataRaport()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="luna" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="incasari" fill="#8884d8" />
                  <Bar dataKey="cheltuieli" fill="#82ca9d" />
                  <Bar dataKey="balanta" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function FormularIncasariCheltuieli({ onSubmit, categorii, valuta }) {
  const [categorie, setCategorie] = useState(categorii[0])
  const [suma, setSuma] = useState("")

  const gestioneazaSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (suma) {
      onSubmit(categorie, suma)
      setSuma("")
    }
  }

  return (
    <form onSubmit={gestioneazaSubmit} className="space-y-4 mb-4">
      <div>
        <Label htmlFor="categorie">Categorie</Label>
        <Select value={categorie} onValueChange={setCategorie}>
          <SelectTrigger id="categorie">
            <SelectValue placeholder="Selectați categoria" />
          </SelectTrigger>
          <SelectContent>
            {categorii.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="suma">Sumă</Label>
        <Input
          id="suma"
          type="number"
          value={suma}
          onChange={(e) => setSuma(e.target.value)}
          placeholder={`Introduceți suma în ${valuta}`}
        />
      </div>
      <Button type="submit">Adaugă</Button>
    </form>
  )
}

function AfisareIncasariCheltuieli({ data, valuta }) {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Sumar:</h3>
      <ScrollArea className="h-[200px]">
        {Object.entries(data).map(([lunaAn, categorii]) => (
          <div key={lunaAn} className="mb-4">
            <h4 className="font-semibold">{lunaAn}</h4>
            {Object.entries(categorii).map(([categorie, suma]) => (
              <div key={categorie} className="flex justify-between mb-1">
                <span>{categorie}:</span>
                <span>{suma} {valuta}</span>
              </div>
            ))}
          </div>
        ))}
      </ScrollArea>
    </div>
  )
}
