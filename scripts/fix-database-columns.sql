-- Database'de olmayan kolonları kaldırmak için migration
-- Eğer kolonlar varsa hata vermeyecek, yoksa da sorun yok

-- ev_charging_options kolonunu kaldır (eğer varsa)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'places' AND column_name = 'ev_charging_options'
    ) THEN
        ALTER TABLE places DROP COLUMN ev_charging_options;
        RAISE NOTICE 'ev_charging_options kolonu kaldırıldı';
    END IF;
END $$;

-- fuel_options kolonunu kaldır (eğer varsa)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'places' AND column_name = 'fuel_options'
    ) THEN
        ALTER TABLE places DROP COLUMN fuel_options;
        RAISE NOTICE 'fuel_options kolonu kaldırıldı';
    END IF;
END $$;

-- indoor_options kolonunu kaldır (eğer varsa)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'places' AND column_name = 'indoor_options'
    ) THEN
        ALTER TABLE places DROP COLUMN indoor_options;
        RAISE NOTICE 'indoor_options kolonu kaldırıldı';
    END IF;
END $$;
